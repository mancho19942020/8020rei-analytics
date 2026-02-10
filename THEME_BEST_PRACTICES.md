# Theme Handling Best Practices

**Date:** February 10, 2026
**Status:** Production Guidelines
**Related:** `.claude/skills/dashboard-builder/SKILL.md`

---

## Overview

This document outlines the best practices for handling light and dark mode in the 8020METRICS HUB analytics dashboard. Following these guidelines ensures smooth theme transitions without visual bugs.

**Important:** When building dashboard components, always consult the Dashboard Builder Skill at `.claude/skills/dashboard-builder/SKILL.md` for complete patterns.

---

## Golden Rules

### 0. **Design Philosophy - Soft Light, Unified Dark**

**Core Principles:**
- Light mode uses subtle gray backgrounds (`light-gray-bg` class) for main content areas - easier on the eyes
- Dark mode uses unified dark grays (`#111827`) - never pure black
- Cards should "float" above the background with proper contrast
- Shadows should be subtle by default (`shadow-xs`), only prominent on hover/interaction

**Main Content Area Pattern:**
```tsx
// DO: Use the CSS class from globals.css
className="light-gray-bg"

// Light mode: subtle gray (#f3f4f6)
// Dark mode: automatically uses var(--surface-base) = #111827
```

### 1. **Tailwind Color Classes May Not Work - Use CSS Classes**

Many Tailwind color utility classes don't apply correctly in this project. **Always use custom CSS classes** defined in `globals.css` instead.

**DO:**
```tsx
// For gray backgrounds (light mode only)
<div className="light-gray-bg">

// For selected navigation tabs
<button className="selected-tab-line">
<button className="selected-tab-contained">

// For skeleton loaders
<div className="skeleton-bg skeleton-animate">
```

**DON'T:**
```tsx
// These Tailwind classes may not work:
<div className="bg-neutral-100">  // Won't apply
<div className="bg-gray-200">     // Won't apply
<div className="text-main-500">   // Won't apply
```

### 2. **Always Use Semantic Tokens for Surface Colors**

**DO:**
```tsx
<div className="bg-surface-base">
<div className="bg-surface-raised">
<div className="border-stroke">
```

**DON'T:**
```tsx
<div className="bg-white dark:bg-neutral-900">
<div className="bg-neutral-50 dark:bg-neutral-800">
<div className="border-neutral-200 dark:border-neutral-700">
```

**Why:** Semantic tokens are CSS variables that automatically change when the theme changes. Explicit `dark:` variants can override these variables and cause transition bugs.

---

### 3. **Use Semantic Tokens for Text Colors**

**DO:**
```tsx
<h1 className="text-content-primary">
<p className="text-content-secondary">
<span className="text-content-tertiary">
```

**DON'T:**
```tsx
<h1 className="text-neutral-900 dark:text-white">
<p className="text-neutral-600 dark:text-neutral-400">
```

---

### 4. **When to Use `dark:` Variants**

You **CAN** use `dark:` variants for:

#### A. Semantic Color States
```tsx
// Callout backgrounds with semantic colors
<div className="bg-success-50 dark:bg-success-950">

// Tag colors
<span className="bg-info-100 dark:bg-info-900/40 text-info-800 dark:text-info-200">
```

#### B. Interaction States
```tsx
// Selected row highlighting
<tr className={isSelected ? 'bg-main-50 dark:bg-main-950/30' : 'bg-surface-base'}>

// Hover states
<button className="hover:bg-neutral-100 dark:hover:bg-neutral-800">
```

#### C. Loading Skeletons (Use CSS Classes Instead!)
```tsx
// PREFERRED: Use CSS classes from globals.css
<div className="skeleton-bg skeleton-animate">

// ACCEPTABLE: Inline dark: variants
<div className="bg-neutral-200 dark:bg-neutral-700 animate-pulse">
```

---

### 5. **Never Override Semantic Surface Tokens**

**CRITICAL BUG TO AVOID:**

```tsx
// BAD - This causes theme transition bugs
<div className="bg-surface-base dark:bg-neutral-900">

// GOOD - Let semantic tokens handle it
<div className="bg-surface-base">
```

**Real Bug Example:**

In AxisTable, we had:
```tsx
<tr className="bg-surface-base dark:bg-neutral-900">
```

This caused the table to stay dark even in light mode because `dark:bg-neutral-900` overrode the semantic token's light mode value.

**Fix:**
```tsx
<tr className="bg-surface-base">
```

---

### 6. **Shadows Should Be Subtle by Default**

**Design Principle:** Shadows indicate elevation and interactivity. Use minimal shadows at rest, stronger on interaction.

**Shadow Scale:**
```tsx
// Default widget/card state
className="shadow-xs"

// Hover state (normal mode)
className="hover:shadow-sm"

// Hover state (edit mode - indicates draggable)
className="hover:shadow-md"
```

**Widget Pattern:**
```tsx
className="shadow-xs transition-all duration-200 hover:shadow-sm"
```

---

## CSS Classes Reference (globals.css)

### Background Classes

| Class | Light Mode | Dark Mode | Use For |
|-------|------------|-----------|---------|
| `light-gray-bg` | `#f3f4f6` | `var(--surface-base)` | Navigation, toolbar, main content |

### Selected Tab Classes

| Class | Light Mode | Dark Mode | Use For |
|-------|------------|-----------|---------|
| `selected-tab-line` | `#3b82f6` | `#60a5fa` | Line variant tabs |
| `selected-tab-contained` | `#3b82f6` | `#60a5fa` | Contained variant tabs |

### Skeleton Loader Classes

| Class | Description |
|-------|-------------|
| `skeleton-bg` | Theme-aware background for skeletons |
| `skeleton-icon` | Theme-aware icon color |
| `skeleton-animate` | Pulse animation (2s) |
| `skeleton-wave` | Wave/shimmer animation (1.5s) |

---

## Semantic Token Reference

### Surface Colors
```css
bg-surface-base        /* Main background: #ffffff / #111827 */
bg-surface-raised      /* Cards, elevated: #f9fafb / #1f2937 */
bg-surface-overlay     /* Overlays: #f3f4f6 / #374151 */
bg-surface-sunken      /* Inset areas: #f3f4f6 / #030712 */
```

### Content Colors
```css
text-content-primary   /* Main text */
text-content-secondary /* Supporting text */
text-content-tertiary  /* Subtle text */
text-content-disabled  /* Disabled state */
text-content-inverse   /* Text on dark backgrounds */
```

### Border Colors
```css
border-stroke          /* Standard borders */
border-stroke-subtle   /* Subtle borders */
border-stroke-strong   /* Emphasized borders */
```

### Semantic Status Colors

Available shades: **50, 100, 300, 500, 700, 900, 950** only.

```css
/* Success */
text-success-700 dark:text-success-300
bg-success-50 dark:bg-success-950

/* Error */
text-error-700 dark:text-error-300
bg-error-50 dark:bg-error-950

/* Alert */
text-alert-700 dark:text-alert-300
bg-alert-50 dark:bg-alert-950

/* Info */
text-info-700 dark:text-info-300
bg-info-50 dark:bg-info-950

/* Main (Blue) */
text-main-700 dark:text-main-300
bg-main-50 dark:bg-main-950
```

---

## Color Palette Reference

### Main Brand Color (Blue)
- `main-50`: `#eff6ff`
- `main-100`: `#dbeafe`
- `main-300`: `#93c5fd`
- `main-500`: `#3b82f6`
- `main-700`: `#1d4ed8`
- `main-900`: `#1e3a8a`
- `main-950`: `#172554`

### Neutral Scale (Full)
- `neutral-50` through `neutral-950` (all shades available)

### Accent Colors (12 Total)
Each accent has shades: 50, 100, 300, 500, 700, 900, 950

| Accent | Color Family | Example |
|--------|--------------|---------|
| `accent-1` | Blue | `#3b82f6` |
| `accent-2` | Indigo | `#6366f1` |
| `accent-3` | Orange | `#f97316` |
| `accent-4` | Lime | `#84cc16` |
| `accent-5` | Pink | `#ec4899` |
| `accent-6` | Teal | `#14b8a6` |
| `accent-7` | Rose | `#f43f5e` |
| `accent-8` | Amber | `#f59e0b` |
| `accent-9` | Emerald | `#10b981` |
| `accent-10` | Violet | `#8b5cf6` |
| `accent-11` | Sky | `#0ea5e9` |
| `accent-12` | Slate | `#64748b` |

### Chart Colors (Data Visualization)
```css
chart-1: #3b82f6   /* Blue - Primary */
chart-2: #22c55e   /* Green - Success */
chart-3: #f97316   /* Orange - Attention */
chart-4: #8b5cf6   /* Violet - Secondary */
chart-5: #ec4899   /* Pink - Highlight */
chart-6: #14b8a6   /* Teal - Tertiary */
chart-7: #f59e0b   /* Amber - Warning */
chart-8: #ef4444   /* Red - Error */
chart-9: #6366f1   /* Indigo - Alternative */
chart-10: #84cc16  /* Lime - Positive Alt */
chart-11: #0ea5e9  /* Sky - Info */
chart-12: #64748b  /* Slate - Neutral */
```

---

## Light/Dark Mode Visual Hierarchy

### Light Mode
| Area | Background | Class/Value |
|------|------------|-------------|
| Header | White | `bg-surface-base` |
| Navigation | Gray | `light-gray-bg` |
| Toolbar | Gray | `light-gray-bg` |
| Main Content | Gray | `light-gray-bg` |
| Widget Cards | White | `bg-surface-base` |

### Dark Mode
| Area | Background | Value |
|------|------------|-------|
| All Areas | Dark Gray | `#111827` |
| Widget Cards | Elevated Gray | `#1f2937` |

---

## Theme Hook Usage

The `useTheme` hook in `src/hooks/useTheme.ts` provides:

```tsx
const {
  preference,      // 'light' | 'dark' | 'system'
  resolvedTheme,   // 'light' | 'dark' (what's showing)
  isDark,          // Boolean convenience
  setTheme,        // Set specific theme
  toggleTheme,     // Toggle light/dark
  cycleTheme,      // Cycle: system → light → dark → system
  isMounted,       // SSR safety flag
} = useTheme();
```

**Default Behavior:**
- New users default to **dark mode**
- Preference persisted to `localStorage` under key `'theme-preference'`
- FOUC prevention via initial state handling

---

## How to Verify Theme Transitions

### 1. Visual Testing
- Toggle theme using ThemeToggle component
- Check all sections: header, navigation, toolbar, scorecards, charts, table
- Ensure no elements remain in the wrong theme

### 2. Code Review Checklist
```bash
# Find potential issues - should return ZERO results
grep -r "bg-surface.*dark:bg-" src/components/
```

### 3. Component Testing
Test these components thoroughly:
- AxisTable - Most complex component
- AxisCard - Used throughout dashboard
- AxisSelect - Interactive component
- AxisCallout - Semantic color component
- AxisNavigationTab - Navigation system
- All widgets in `src/components/workspace/widgets/`

---

## Skeleton Loaders

### Theme Consistency
Skeletons MUST use CSS classes that auto-adapt to themes:

```tsx
// PREFERRED: CSS classes
<div className="skeleton-bg skeleton-animate rounded-lg h-32" />

// For wave effect
<div className="skeleton-wave rounded-lg h-32" />
```

### Minimalistic Design
Skeletons should be simple blocks reflecting content shape, NOT detailed replicas:

```tsx
// GOOD: Simple widget placeholder
<AxisSkeleton variant="widget" height="140px" fullWidth />

// BAD: Detailed card with inner elements
<div className="border rounded-lg">
  <AxisSkeleton variant="image" />
  <AxisSkeleton variant="text" lines={2} />
</div>
```

---

## Implementation Guidelines

### For New Components

1. **Start with semantic tokens**
   ```tsx
   export function MyComponent() {
     return (
       <div className="bg-surface-raised border border-stroke">
         <h2 className="text-content-primary">Title</h2>
         <p className="text-content-secondary">Description</p>
       </div>
     );
   }
   ```

2. **Only add `dark:` variants for semantic colors or interactions**
   ```tsx
   // If you need a success state
   <div className="bg-success-50 dark:bg-success-950">
   ```

3. **Test theme transitions immediately**

### For Existing Components

1. Review current color usage: `grep "dark:" src/components/MyComponent.tsx`
2. Replace surface colors with semantic tokens
3. Keep `dark:` variants only where appropriate
4. Test thoroughly before committing

---

## Debugging Theme Issues

### Issue: Component stays in wrong theme after toggle

**Cause:** Hardcoded `dark:` variant overriding a semantic token

**Fix:**
```tsx
// Before
<div className="bg-surface-base dark:bg-neutral-900">

// After
<div className="bg-surface-base">
```

### Issue: Colors don't have enough contrast

**Fix:** Use stronger token:
```tsx
// Before - too subtle
className="text-content-tertiary"

// After - more visible
className="text-content-secondary"
```

### Issue: Tailwind color class not applying

**Cause:** Project CSS configuration issue with some Tailwind utilities

**Fix:** Use CSS classes from `globals.css`:
```tsx
// Before - doesn't work
className="bg-neutral-100"

// After - works
className="light-gray-bg"
```

---

## Design System Compliance

### WCAG AA Compliance
- **Text contrast:** 4.5:1 minimum
- **UI contrast:** 3:1 minimum
- Both light and dark modes meet these ratios

### Color Tokens
- All colors use semantic naming
- CSS variables defined in `globals.css`
- Automatic theme switching via `.dark` class on `<html>`

### Theme Toggle
- Located in `src/components/ThemeToggle.tsx`
- Persists preference to `localStorage`
- Uses `useTheme` hook from `src/hooks/useTheme.ts`
- No flash of unstyled content (FOUC)

---

## Verification Checklist

Before committing theme-related changes:

- [ ] All surface colors use semantic tokens (`bg-surface-*`)
- [ ] All text colors use semantic tokens (`text-content-*`)
- [ ] All borders use semantic tokens (`border-stroke*`)
- [ ] `dark:` variants only used for semantic colors or interactions
- [ ] Gray backgrounds use `light-gray-bg` class (NOT Tailwind utilities)
- [ ] Selected tabs use `selected-tab-line` or `selected-tab-contained` classes
- [ ] Manually toggled theme in browser - no visual bugs
- [ ] Checked all pages and sections
- [ ] No hardcoded color values (`#hex` or `rgb()`)
- [ ] Ran grep check: `grep -r "bg-surface.*dark:bg-" src/` returns zero results
- [ ] Shadow intensity is appropriate (`shadow-xs` default)
- [ ] Skeleton loaders use CSS classes (`skeleton-bg`, `skeleton-animate`, `skeleton-wave`)

---

## Related Documentation

- **Dashboard Builder Skill:** `.claude/skills/dashboard-builder/SKILL.md`
- **Global Styles:** `src/app/globals.css`
- **Theme Hook:** `src/hooks/useTheme.ts`
- **Theme Toggle:** `src/components/ThemeToggle.tsx`
- **Axis Components:** `src/components/axis/`
- **Workspace Widgets:** `src/components/workspace/widgets/`

---

## Key Takeaways

1. **Use CSS classes over Tailwind color utilities** - `light-gray-bg`, `selected-tab-*`, `skeleton-*`
2. **Semantic tokens are your friend** - Use them for all surface and text colors
3. **`dark:` variants are for exceptions** - Only use for semantic colors and interactions
4. **Never override semantic surface tokens** - This causes theme transition bugs
5. **Test theme transitions** - Toggle manually before committing
6. **Light mode should NOT be harsh white** - Use `light-gray-bg` for main content
7. **Dark mode should NOT be pure black** - Uses `#111827` everywhere
8. **Shadows should be subtle by default** - Use `shadow-xs`, increase only on hover
9. **Skeletons are minimalistic** - Simple blocks, not detailed replicas
10. **Default is dark mode** - New users start in dark mode

---

**Last Updated:** February 10, 2026
