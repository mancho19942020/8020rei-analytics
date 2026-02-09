# Axis Design System - Complete Guide for New Projects

## What is Axis?

**Axis** is a production-grade, multi-brand design system built for **Nuxt 4 (Vue 3) + TailwindCSS** applications. It was created to be the single source of truth across multiple SaaS platforms, ensuring visual consistency, accessibility, and scalability.

Axis is designed from the ground up to be **brand-agnostic**. The same components, the same layout rules, and the same patterns work across any product -- you only change the **token values** (colors, fonts) to rebrand the entire platform.

**For this analytics project, the main brand color is BLUE** (replacing green from the original platform).

---

## Philosophy & Core Principles

### Design Philosophy

1. **Data Density First** -- Our users work with large datasets. Every pixel should serve a purpose. Maximize information density while maintaining readability.
2. **Speed Over Aesthetics** -- Performance is a feature. If a choice is between beautiful and fast, choose fast. Users value efficiency over decoration.
3. **Scalable by Design** -- Everything we build must work across multiple products. Use semantic naming and tokens, not hard-coded values.
4. **Accessible by Default** -- Accessibility is not optional. All components must meet WCAG AA standards. Design for all users from the start.

### UX Principles We Follow

Axis is grounded in established UX research:

- **Jakob Nielsen's 10 Usability Heuristics** -- Visibility of system status, match with real world, user control, consistency, error prevention, recognition over recall, flexibility, minimalist design, error recovery, and help documentation.
- **Hick's Law** -- Reduce the number of choices to speed up decisions.
- **Fitts's Law** -- Make important interactive elements larger and closer to the user's expected click position.
- **Miller's Law** -- Chunk information into groups of 7 (plus or minus 2).
- **Doherty Threshold** -- Keep response times under 400ms for perceived interactivity.
- **Aesthetic-Usability Effect** -- Beautiful design is perceived as more usable. Good visual design increases tolerance for minor issues.

---

## Token Architecture

### How Tokens Work

Axis uses a **semantic token system**. Instead of using literal color names (`blue-500`, `green-700`), we use **purpose-based names** that describe what the color does, not what it looks like:

| Token Type | Examples | Purpose |
|---|---|---|
| **main** | `main-50` through `main-950` | Primary brand color (the identity color) |
| **accent-1 to accent-5** | `accent-1-500`, `accent-3-700` | Charts, data visualization, highlights |
| **neutral** | `neutral-50` through `neutral-950` | Text, backgrounds, borders, disabled states |
| **success** | `success-500`, `success-700` | Positive feedback, confirmations |
| **alert** | `alert-500`, `alert-700` | Warnings, cautions |
| **error** | `error-500`, `error-700` | Errors, destructive actions |
| **info** | `info-500`, `info-700` | Informational, neutral feedback |

### For This Project: Blue Brand

The `main` color in `tailwind.config.ts` must be changed from green to **blue**. Here is the recommended blue palette:

```javascript
main: {
  50: "#eff6ff",
  100: "#dbeafe",
  300: "#93c5fd",
  500: "#3b82f6",
  700: "#1d4ed8",
  900: "#1e3a8a",
  950: "#172554",
},
```

Everything else (accent colors, neutrals, semantic status colors) stays the same. **That's all you need to rebrand the entire platform.**

### Rules (Non-Negotiable)

- **NEVER** use raw color names: `bg-blue-500`, `text-green-700`, `border-red-300`
- **ALWAYS** use semantic tokens: `bg-main-500`, `text-success-700`, `border-error-300`
- This ensures that rebranding is a single token change, not a global search-and-replace.

---

## Dark Mode (MANDATORY)

### Overview

Axis supports **both light and dark modes**. This is not optional -- every component, every page, every custom element must work correctly in both themes.

Dark mode is toggled via a `.dark` CSS class on the `<html>` element (class-based strategy, configured in `tailwind.config.ts`).

### Semantic Theme Tokens (CSS Variables)

Axis provides CSS-variable-based tokens that automatically adapt to the current theme:

**Surface tokens** (backgrounds & containers):
| Token | Light | Dark | Usage |
|---|---|---|---|
| `surface-base` | `#ffffff` | `#111827` | Page backgrounds, main content |
| `surface-raised` | `#f9fafb` | `#1f2937` | Cards, elevated containers |
| `surface-overlay` | `#ffffff` | `#1f2937` | Modals, popovers |
| `surface-sunken` | `#f3f4f6` | `#030712` | Recessed areas, table headers |

**Content tokens** (text hierarchy):
| Token | Light | Dark | Usage |
|---|---|---|---|
| `content-primary` | `#111827` | `#f9fafb` | Headings, primary text |
| `content-secondary` | `#4b5563` | `#d1d5db` | Body text, descriptions |
| `content-tertiary` | `#9ca3af` | `#6b7280` | Labels, hints, metadata |
| `content-disabled` | `#d1d5db` | `#374151` | Disabled text |
| `content-inverse` | `#ffffff` | `#111827` | Text on colored backgrounds |

**Stroke tokens** (borders & dividers):
| Token | Light | Dark | Usage |
|---|---|---|---|
| `stroke` | `#e5e7eb` | `#374151` | Default borders |
| `stroke-subtle` | `#f3f4f6` | `#1f2937` | Subtle dividers |
| `stroke-strong` | `#d1d5db` | `#4b5563` | Emphasized borders |

### How to Use

**Preferred approach -- semantic tokens (auto-adapt):**
```html
<div class="bg-surface-base text-content-primary border-stroke">
  <h2 class="text-content-primary">Title</h2>
  <p class="text-content-secondary">Description text</p>
  <span class="text-content-tertiary">Metadata</span>
</div>
```

**When semantic tokens aren't available -- manual dark variants:**
```html
<div class="bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100">
  <span class="bg-main-50 dark:bg-main-950 text-main-700 dark:text-main-300">Tag</span>
</div>
```

### Dark Mode Rules

1. **NEVER** use `bg-white` without a corresponding `dark:bg-neutral-900` (or a semantic token)
2. **NEVER** use `text-neutral-800` without `dark:text-neutral-100` (or a semantic token)
3. **ALWAYS** verify contrast ratios in both themes (WCAG AA: 4.5:1 for text, 3:1 for UI)
4. **PREFER** semantic tokens (`surface-base`, `content-primary`) over manual `dark:` variants
5. **TEST** every page in both modes before considering it done

---

## Typography

Axis uses the **Inter** font family with a carefully designed typographic scale.

### Scale

| Token | Size | Weight | Line Height | Usage |
|---|---|---|---|---|
| `text-h1` | 22px | 600 | 1.3 | Page titles |
| `text-h2` | 20px | 600 | 1.3 | Section titles |
| `text-h3` | 18px | 600 | 1.35 | Subsection titles |
| `text-h4` | 16px | 600 | 1.4 | Card titles, section headers |
| `text-h5` | 14px | 600 | 1.4 | Small headings |
| `text-body-large` | 16px | 400 | 1.5 | Featured body text |
| `text-body-regular` | 14px | 400 | 1.5 | Standard body text |
| `text-label` | 12px | 400 | 1.4 | Form labels, metadata |
| `text-label-bold` | 12px | 500 | 1.4 | Emphasized labels |
| `text-suggestion` | 10px | 400 | 1.4 | Badges, tags, timestamps |
| `text-button-regular` | 14px | 500 | 1.4 | Button text |
| `text-button-small` | 12px | 500 | 1.4 | Small button text |

### Rules

- **Minimum readable size:** 14px for body text, 12px for labels
- 10px (`text-suggestion`) is only for badges, tags, and timestamps -- never for body content
- Headlines use tighter line heights (1.3) for visual impact
- Body text uses looser line heights (1.5) for readability

---

## Layout System

### Application Shell

The standard layout consists of:

| Zone | Dimension | Description |
|---|---|---|
| **Header** | 48px tall, fixed | Top bar with logo, search, user menu |
| **Sidebar (collapsed)** | 56px wide, fixed | Icons only, tooltip labels on hover |
| **Sidebar (expanded)** | 224px wide, fixed | Icons with text labels, expandable submenus |
| **Content** | Fills remaining space | Main area, adjusts padding based on sidebar state |

### Layout Types

**1. Full-Width Responsive** -- For data-dense interfaces:
- Dashboards, data tables, maps, analytics, list views
- Content stretches to fill available width (no `max-width`)
- Grids reflow at breakpoints

**2. Bounded Content** -- For focused content:
- Forms, settings, documentation, onboarding
- Content centered with `max-w-5xl` (1024px)
- Ensures readability for text-heavy pages

### Layout Rules (All Mandatory)

1. **Maximize Content Space** -- Compact header (48px), collapsible sidebar (56px/224px). Reduce chrome, increase content.
2. **Flat Sections with Dividers** -- No cards or wrappers for sections. Use horizontal divider lines (`border-b border-stroke`) between sections.
3. **Consistent Section Padding** -- All sections use `px-6 py-4` padding. Tight, uniform spacing.
4. **Uniform Background** -- All page backgrounds use `bg-surface-base`. Never use `bg-surface-sunken` for page backgrounds.
5. **Section Header Pattern** -- Section titles (`text-h4`) in their own header bar with `border-b border-stroke`. Content below in a separate area.
6. **Page Header Pattern** -- Non-dashboard pages have a page header bar: `bg-surface-base border-b border-stroke px-6 py-4`. Title uses `text-h4`.

### Page Structure Patterns

**Dashboard Section:**
```html
<div class="border-b border-stroke bg-surface-base">
  <div class="flex items-center justify-between px-6 py-4 border-b border-stroke-subtle">
    <h2 class="text-h4 text-content-primary">Section Title</h2>
    <AxisButton variant="outlined" size="sm">Action</AxisButton>
  </div>
  <div class="p-4">
    <!-- Content here -->
  </div>
</div>
```

**Standard Page:**
```html
<div class="min-h-screen bg-surface-base">
  <!-- Page Header -->
  <div class="bg-surface-base border-b border-stroke px-6 py-4">
    <h1 class="text-h4 text-content-primary">Page Title</h1>
  </div>

  <!-- Filter Bar (optional) -->
  <div class="bg-surface-base border-b border-stroke px-6 py-4">
    <div class="flex items-center justify-between">
      <AxisInput type="search" placeholder="Search..." />
      <AxisSelect :options="options" />
    </div>
  </div>

  <!-- Content -->
  <div class="p-6">
    <!-- Content here -->
  </div>
</div>
```

**Detail Page:**
```html
<div class="min-h-screen bg-surface-base">
  <!-- Back Navigation -->
  <div class="bg-surface-base border-b border-stroke px-6 py-3">
    <AxisButton variant="ghost" size="sm" :icon-left="ArrowLeftIcon">
      Back to List
    </AxisButton>
  </div>

  <!-- Page Header -->
  <div class="bg-surface-base border-b border-stroke px-6 py-4">
    <h1 class="text-h4 text-content-primary">Item Name</h1>
  </div>

  <!-- Content -->
  <div class="p-6">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-1"><!-- Sidebar card --></div>
      <div class="lg:col-span-2"><!-- Main content --></div>
    </div>
  </div>
</div>
```

### Spacing Scale

| Tailwind | Pixels | Usage |
|---|---|---|
| `p-1` / `gap-1` | 4px | Icon gaps, tight spacing |
| `p-2` / `gap-2` | 8px | Small gaps between items |
| `p-3` / `mb-3` | 12px | Section header margin |
| `p-4` / `py-4` | 16px | Section vertical padding |
| `p-6` / `px-6` | 24px | Section horizontal padding |
| `p-8` | 32px | Large separations |

### Responsive Breakpoints

| Breakpoint | Width | Device | Sidebar |
|---|---|---|---|
| `sm` | 640px | Mobile landscape | Hidden or collapsed |
| `md` | 768px | Tablets | Collapsed (icons only) |
| `lg` | 1024px | Desktop | User preference (default: collapsed) |
| `xl` | 1280px | Large desktop | User preference |
| `2xl` | 1536px | Extra large | User preference |

---

## Components

### Available Axis Components

All UI elements MUST use Axis components. **Never use raw HTML** (`<button>`, `<input>`, `<select>`, `<textarea>`).

| Component | File | Use For |
|---|---|---|
| **AxisButton** | `AxisButton.vue` | All buttons (actions, navigation, submit) |
| **AxisInput** | `AxisInput.vue` | Text, email, password, search inputs |
| **AxisSelect** | `AxisSelect.vue` | Dropdowns (single/multiple, searchable) |
| **AxisCallout** | `AxisCallout.vue` | Info, success, warning, error feedback |
| **AxisCheckbox** | `AxisCheckbox.vue` | Multiple selections, boolean choices |
| **AxisCheckboxGroup** | `AxisCheckboxGroup.vue` | Group of related checkboxes |
| **AxisRadio** | `AxisRadio.vue` | Single selection from 2-5 options |
| **AxisRadioGroup** | `AxisRadioGroup.vue` | Group of related radio buttons |
| **AxisToggle** | `AxisToggle.vue` | On/off switches, instant settings |
| **AxisTable** | `AxisTable.vue` | Data tables with sorting, filtering, pagination |
| **AxisCard** | `AxisCard.vue` | Content containers |
| **AxisCardGroup** | `AxisCardGroup.vue` | Grid of related cards |
| **AxisAccordion** | `AxisAccordion.vue` | Expandable/collapsible content |
| **AxisBreadcrumb** | `AxisBreadcrumb.vue` | Navigation breadcrumbs |
| **AxisPill** | `AxisPill.vue` | Status indicators, badges |
| **AxisTag** | `AxisTag.vue` | Labels, categories |
| **AxisSlider** | `AxisSlider.vue` | Range selection |
| **AxisStepper** | `AxisStepper.vue` | Multi-step progress indicator |
| **AxisToast** | `AxisToast.vue` | Temporary notifications |
| **AxisSkeleton** | `AxisSkeleton.vue` | Loading placeholders |
| **AxisStarRating** | `AxisStarRating.vue` | Rating input/display |
| **AxisPhoneInput** | `AxisPhoneInput.vue` | Phone number input |
| **AxisAutocomplete** | `AxisAutocomplete.vue` | Search with suggestions |
| **AxisNavigationTab** | `AxisNavigationTab.vue` | Tab navigation |
| **AxisButtonGroup** | `AxisButtonGroup.vue` | Grouped toggle buttons |

### Usage Examples

```vue
<!-- Buttons -->
<AxisButton variant="primary">Save</AxisButton>
<AxisButton variant="outlined" :icon-left="PlusIcon">Add Item</AxisButton>
<AxisButton variant="ghost" size="sm">Cancel</AxisButton>

<!-- Inputs -->
<AxisInput v-model="email" type="email" label="Email" placeholder="name@example.com" :error="emailError" />
<AxisInput v-model="search" type="search" placeholder="Search analytics..." />

<!-- Select -->
<AxisSelect v-model="period" :options="periodOptions" label="Time Period" />
<AxisSelect v-model="metrics" :options="metricOptions" label="Metrics" multiple searchable />

<!-- Feedback -->
<AxisCallout type="success" title="Export Complete" dismissible>
  Your data has been exported successfully.
</AxisCallout>
<AxisCallout type="error" title="Connection Failed">
  Unable to reach the analytics server.
</AxisCallout>

<!-- Selection Controls -->
<AxisCheckbox v-model="accepted" label="I accept the terms" />
<AxisRadio v-model="view" value="chart" name="view-type" label="Chart View" />
<AxisToggle v-model="darkMode" label="Dark Mode" />

<!-- Data Display -->
<AxisTable :columns="columns" :data="rows" sortable paginated :page-size="25" />
```

---

## Shadows

Shadows use CSS variables that adapt to light/dark mode:

| Token | Usage |
|---|---|
| `shadow-none` | No shadow |
| `shadow-xs` | Subtle elevation (small cards, tags) |
| `shadow-sm` | Default elevation (cards, dropdowns) |
| `shadow-md` | Medium elevation (popovers, floating elements) |
| `shadow-lg` | High elevation (modals, dialogs) |
| `shadow-xl` | Maximum elevation (notifications, toasts) |

---

## Border Radius

| Token | Value | Usage |
|---|---|---|
| `rounded-none` | 0px | No rounding |
| `rounded-xs` | 2px | Subtle rounding |
| `rounded-sm` | 4px | Tags, badges |
| `rounded` | 6px | Default (buttons, inputs) |
| `rounded-md` | 8px | Cards, containers |
| `rounded-lg` | 12px | Large cards, modals |
| `rounded-xl` | 16px | Feature cards |
| `rounded-full` | 9999px | Avatars, pills |

---

## Motion & Animation

- **Default transition:** `duration-200 ease-out`
- **Always** respect `prefers-reduced-motion`
- Use transitions for: hover states, focus states, theme toggles, sidebar expand/collapse
- **Never** use motion that blocks user interaction or lasts longer than 400ms

---

## Accessibility (WCAG AA Required)

All components and pages must meet **WCAG 2.2 AA** standards:

1. **Contrast ratios:** 4.5:1 for normal text, 3:1 for large text and UI elements
2. **Keyboard navigation:** All interactive elements must be reachable and operable via keyboard (Tab, Enter, Escape, Arrow keys)
3. **Focus indicators:** Clearly visible focus rings on all interactive elements
4. **ARIA labels:** All interactive elements need `aria-label` or visible text labels
5. **No color-only information:** Don't communicate status using color alone (add icons or text)
6. **Screen reader support:** Semantic HTML, proper heading hierarchy, landmark regions
7. **Motion:** Respect `prefers-reduced-motion` media query

---

## Icons

Axis uses **Heroicons** (by the Tailwind team) as the standard icon library.

```bash
npm install @heroicons/vue
```

Usage:
```vue
<script setup>
import { MagnifyingGlassIcon, PlusIcon, ArrowLeftIcon } from '@heroicons/vue/24/outline'
</script>

<template>
  <AxisButton :icon-left="PlusIcon">Add</AxisButton>
</template>
```

Standard sizes:
- 16px (`w-4 h-4`) -- Inside buttons, form elements
- 20px (`w-5 h-5`) -- Sidebar items, medium context
- 24px (`w-6 h-6`) -- Standalone icons, headers

---

## Naming Conventions

| Type | Convention | Example |
|---|---|---|
| Components | PascalCase, `Axis` prefix | `AxisButton.vue`, `AxisTable.vue` |
| Custom components | PascalCase | `AppHeader.vue`, `UserMenu.vue` |
| Composables | camelCase, `use` prefix | `useTheme.ts`, `useAuth.ts` |
| Pages | kebab-case | `design-system/colors.vue` |
| CSS classes | Tailwind utilities | `text-h4 text-content-primary` |

---

## Quick Start Checklist for New Projects

1. [ ] Project uses Nuxt 4 (or Vue 3) + TailwindCSS
2. [ ] Copy `components/axis/` into your project
3. [ ] Copy `tailwind.config.ts` and change `main` color to blue
4. [ ] Copy `composables/useTheme.ts` for dark mode toggle
5. [ ] Add CSS variables for surface/content/stroke/shadow tokens
6. [ ] Install `@heroicons/vue` and `Inter` font
7. [ ] Copy `.claude/skills/` for AI-assisted development
8. [ ] Test a page in both light and dark mode
9. [ ] Verify no raw `<button>`, `<input>`, `<select>` elements exist

---

## Rebranding Checklist (Token Changes Only)

To adapt Axis for a different brand:

1. **Change `main` palette** in `tailwind.config.ts` (e.g., green to blue)
2. **Optionally adjust `accent-1` through `accent-5`** for data visualization colors
3. **Optionally change font** in `fontFamily.sans` (default: Inter)
4. **Everything else stays the same** -- components, layout, spacing, patterns

That's the power of semantic tokens. The entire platform rebrands with one config change.

---

*Axis Design System -- The center of alignment for all products.*
