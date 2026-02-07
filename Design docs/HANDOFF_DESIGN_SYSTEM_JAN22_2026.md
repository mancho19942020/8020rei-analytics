# 8020 Brand Guidelines & Design System Reference

**Purpose:** Complete design specification for building platforms that look and feel like the 8020 product family. Use this guide to ensure visual consistency across all 8020 properties.

**Last Updated:** February 6, 2026

---

## Table of Contents

1. [Brand Philosophy](#brand-philosophy)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing](#spacing)
5. [Shadows & Elevation](#shadows--elevation)
6. [Border Radius](#border-radius)
7. [Motion & Animation](#motion--animation)
8. [Dark Mode](#dark-mode)
9. [Components](#components)
10. [Layout Patterns](#layout-patterns)
11. [Accessibility](#accessibility)
12. [Implementation Guide](#implementation-guide)

---

## Brand Philosophy

### Core Principles

1. **Scalability First** - Design decisions work across multiple brands and products
2. **Semantic Naming** - Use `main` not `green`, `content-primary` not `neutral-800`
3. **Token Standards** - All values are derived from a consistent token system
4. **Dark Mode Required** - ALL interfaces must support both light and dark themes
5. **Data-Dense Clarity** - Optimized for displaying large amounts of information cleanly

### Design Language

- **Clean & Professional** - Business-focused aesthetic, not playful
- **Information-Dense** - Maximize data visibility without clutter
- **Flat Sections** - Prefer dividers over excessive shadows
- **Consistent Rhythm** - Harmonious spacing and visual hierarchy

---

## Color System

### Token Naming Convention

All colors use semantic names (not color names) for scalability across brands:

```
main-{shade}           Primary brand color
accent-{1-5}-{shade}   Five accent palettes for variety
neutral-{shade}        Gray scale for text, backgrounds, borders
success|alert|error|info-{shade}   Semantic status colors
```

### Main Brand Color

The `main` color is your primary brand color. Change this entire palette to customize for different products.

**For a BLUE main color (Metrics Hub):**

| Token | Hex Value | Usage |
|-------|-----------|-------|
| `main-50` | `#eff6ff` | Light backgrounds, subtle highlights |
| `main-100` | `#dbeafe` | Hover backgrounds, badges |
| `main-300` | `#93c5fd` | Borders, disabled states |
| `main-500` | `#3b82f6` | Icons, secondary elements |
| `main-700` | `#1d4ed8` | **Primary buttons, links, key actions** |
| `main-900` | `#1e3a8a` | Hover states, emphasis |
| `main-950` | `#172554` | Dark backgrounds, high contrast |

**Original GREEN main color (Roofing8020):**

| Token | Hex Value |
|-------|-----------|
| `main-50` | `#f0fdf4` |
| `main-100` | `#dcfce7` |
| `main-300` | `#86efac` |
| `main-500` | `#22c55e` |
| `main-700` | `#15803d` |
| `main-900` | `#14532d` |
| `main-950` | `#052e16` |

### Accent Colors (5 Palettes)

Use for charts, data visualization, and UI variety. These remain consistent across all 8020 products.

#### Accent 1 - Blue Tones
| Shade | Hex | Use |
|-------|-----|-----|
| 50 | `#eff6ff` | Backgrounds |
| 100 | `#dbeafe` | Hover states |
| 300 | `#93c5fd` | Borders |
| 500 | `#3b82f6` | Icons |
| 700 | `#1d4ed8` | Text, emphasis |
| 900 | `#1e3a8a` | High contrast |
| 950 | `#172554` | Dark backgrounds |

#### Accent 2 - Indigo/Purple Tones
| Shade | Hex |
|-------|-----|
| 50 | `#eef2ff` |
| 100 | `#e0e7ff` |
| 300 | `#a5b4fc` |
| 500 | `#6366f1` |
| 700 | `#4338ca` |
| 900 | `#312e81` |
| 950 | `#1e1b4b` |

#### Accent 3 - Orange Tones
| Shade | Hex |
|-------|-----|
| 50 | `#fff7ed` |
| 100 | `#ffedd5` |
| 300 | `#fdba74` |
| 500 | `#f97316` |
| 700 | `#c2410c` |
| 900 | `#7c2d12` |
| 950 | `#431407` |

#### Accent 4 - Lime Tones
| Shade | Hex |
|-------|-----|
| 50 | `#f7fee7` |
| 100 | `#ecfccb` |
| 300 | `#bef264` |
| 500 | `#84cc16` |
| 700 | `#4d7c0f` |
| 900 | `#365314` |
| 950 | `#1a2e05` |

#### Accent 5 - Pink/Magenta Tones
| Shade | Hex |
|-------|-----|
| 50 | `#fdf2f8` |
| 100 | `#fce7f3` |
| 300 | `#f9a8d4` |
| 500 | `#ec4899` |
| 700 | `#be185d` |
| 900 | `#831843` |
| 950 | `#500724` |

### Neutral Scale (Gray)

Used for text, backgrounds, borders, and disabled states.

| Token | Hex | Usage |
|-------|-----|-------|
| `neutral-50` | `#f9fafb` | Light backgrounds |
| `neutral-100` | `#f3f4f6` | Raised surfaces |
| `neutral-200` | `#e5e7eb` | Default borders |
| `neutral-300` | `#d1d5db` | Strong borders |
| `neutral-400` | `#9ca3af` | Disabled text |
| `neutral-500` | `#6b7280` | Tertiary text |
| `neutral-600` | `#4b5563` | Secondary text (dark mode) |
| `neutral-700` | `#374151` | Secondary text |
| `neutral-800` | `#1f2937` | Raised surfaces (dark) |
| `neutral-900` | `#111827` | Primary text, dark base |
| `neutral-950` | `#030712` | Deepest dark |

### Semantic Status Colors

| Color | Use | 500 Hex |
|-------|-----|---------|
| `success` | Positive feedback, confirmations | `#22c55e` |
| `alert` | Warnings, cautions | `#eab308` |
| `error` | Errors, destructive actions | `#ef4444` |
| `info` | Informational, neutral feedback | `#06b6d4` |

Each semantic color has the same shade scale: 50, 100, 300, 500, 700, 900, 950.

### Color Contrast Requirements (MANDATORY)

**WCAG 2.1 AA Compliance Required:**

| Text Type | Required Ratio | Rule |
|-----------|----------------|------|
| Normal text (<18px) | 4.5:1 | Use `neutral-600`+ on white |
| Large text (18px+) | 3:1 | Use `neutral-500`+ on white |
| UI elements | 3:1 | Borders must be `neutral-300`+ |

**Golden Rules for Main Color:**
- **Text:** Use `main-700` or darker for text on light backgrounds
- **Buttons:** Use `bg-main-700` with white text for primary buttons
- **Backgrounds:** Use `main-50` or `main-100` with `main-900` text
- **Never:** Use `main-500` or lighter shades for body text

---

## Typography

### Font Family

**Inter** is the only font family. Available weights: 400 (Regular), 500 (Medium), 600 (SemiBold).

```css
font-family: 'Inter', system-ui, sans-serif;
```

### Type Scale

#### Headlines

| Token | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `text-h1-alt` | 24px | 600 | 1.3 | Hero sections, large displays |
| `text-h1` | 22px | 600 | 1.3 | Page titles |
| `text-h2` | 20px | 600 | 1.3 | Section titles |
| `text-h3` | 18px | 600 | 1.35 | Subsections |
| `text-h4` | 16px | 600 | 1.4 | Component titles |
| `text-h5` | 14px | 600 | 1.4 | Small headers, card titles |
| `text-h6` | 12px | 500 | 1.4 | Micro headers |
| `text-h7` | 10px | 600 | 1.4 | Tiny headers, badges |

#### Body Text

| Token | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `text-body-large` | 16px | 400 | 1.5 | Lead text, introductions |
| `text-body-regular` | 14px | 400 | 1.5 | **Default body text** |

#### Buttons

| Token | Size | Weight | Usage |
|-------|------|--------|-------|
| `text-button-large` | 16px | 500 | Primary CTA buttons |
| `text-button-regular` | 14px | 500 | **Standard buttons** |
| `text-button-small` | 12px | 500 | Compact buttons |

#### Labels & Small Text

| Token | Size | Weight | Usage |
|-------|------|--------|-------|
| `text-label-bold` | 12px | 500 | Form labels, emphasized |
| `text-label` | 12px | 400 | Helper text, metadata |
| `text-link` | 14px | 400 | Inline links |
| `text-link-small` | 12px | 400 | Small links, breadcrumbs |
| `text-suggestion-bold` | 10px | 600 | Emphasized captions |
| `text-suggestion` | 10px | 400 | Captions, footnotes |

### Typography Rules

**Mandatory:**
- Minimum 14px for body text
- Line height 1.5 for body text (readability)
- 10px text only for non-essential info (badges, timestamps)
- Use H1 only once per page
- Progress sequentially (H1 → H2 → H3)

**Prohibited:**
- Raw Tailwind sizes: `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`
- Monospace fonts (even for numbers)
- Serif fonts
- Arbitrary values: `text-[16px]`, `text-[1.5rem]`

---

## Spacing

### Base Unit: 4px

All spacing is based on a 4px unit. Each value is a multiple of 4px.

### Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `p-0` | 0px | No spacing |
| `p-0.5` | 2px | Hairline gaps |
| `p-1` | 4px | Icon gaps, tight spacing |
| `p-1.5` | 6px | Small inner padding |
| `p-2` | 8px | Small gaps between items |
| `p-2.5` | 10px | Badge/chip padding |
| `p-3` | 12px | Section header margin |
| `p-4` | 16px | Section vertical padding |
| `p-5` | 20px | Medium padding |
| `p-6` | 24px | Section horizontal padding |
| `p-8` | 32px | Large separations |
| `p-10` | 40px | Major sections |
| `p-12` | 48px | Page-level spacing |

### Platform Spacing Patterns

| Pattern | Classes | H × V | Description |
|---------|---------|-------|-------------|
| Section Padding | `px-6 py-4` | 24px × 16px | Standard for all page sections |
| Card Padding | `p-4` | 16px × 16px | Internal card padding |
| Button Padding | `px-4 py-2` | 16px × 8px | Standard button padding |
| Input Padding | `px-3 py-2` | 12px × 8px | Form input padding |
| Badge Padding | `px-2 py-0.5` | 8px × 2px | Small badge/tag padding |

### Gap Scale (Flex/Grid)

| Class | Value | Usage |
|-------|-------|-------|
| `gap-1` | 4px | Very tight (icon groups) |
| `gap-2` | 8px | Tight (inline items) |
| `gap-3` | 12px | Default list item spacing |
| `gap-4` | 16px | **Standard grid gap** |
| `gap-6` | 24px | Card grid spacing |
| `gap-8` | 32px | Section separations |

### Spacing Rules

- Use `gap-*` for flex/grid layouts (not margin)
- Keep spacing consistent within sections
- Never use arbitrary values
- Prefer tight spacing - less is usually better

---

## Shadows & Elevation

### Shadow Scale

Shadows use CSS variables that adapt to light/dark mode automatically.

| Token | Tailwind | Usage |
|-------|----------|-------|
| `shadow-none` | `shadow-none` | Flat elements |
| `shadow-xs` | `shadow-xs` | Subtle lift for inputs, cards at rest |
| `shadow-sm` | `shadow-sm` | **Default cards, dropdowns** |
| `shadow-md` | `shadow-md` | Elevated cards, popovers |
| `shadow-lg` | `shadow-lg` | Modals, dialogs |
| `shadow-xl` | `shadow-xl` | Maximum elevation, large overlays |

### CSS Values

**Light Mode:**
```css
--shadow-xs: 0px 1px 2px rgba(16, 24, 40, 0.05);
--shadow-sm: 0px 1px 3px rgba(16, 24, 40, 0.1), 0px 1px 2px rgba(16, 24, 40, 0.06);
--shadow-md: 0px 4px 8px -2px rgba(16, 24, 40, 0.1), 0px 2px 4px -2px rgba(16, 24, 40, 0.06);
--shadow-lg: 0px 12px 16px -4px rgba(16, 24, 40, 0.08), 0px 4px 6px -2px rgba(16, 24, 40, 0.03);
--shadow-xl: 0px 20px 24px -4px rgba(16, 24, 40, 0.08), 0px 8px 8px -4px rgba(16, 24, 40, 0.03);
```

**Dark Mode:** (More prominent)
```css
--shadow-xs: 0px 1px 2px rgba(0, 0, 0, 0.3);
--shadow-sm: 0px 1px 3px rgba(0, 0, 0, 0.4), 0px 1px 2px rgba(0, 0, 0, 0.3);
--shadow-md: 0px 4px 8px -2px rgba(0, 0, 0, 0.5), 0px 2px 4px -2px rgba(0, 0, 0, 0.3);
--shadow-lg: 0px 12px 16px -4px rgba(0, 0, 0, 0.6), 0px 4px 6px -2px rgba(0, 0, 0, 0.3);
--shadow-xl: 0px 20px 24px -4px rgba(0, 0, 0, 0.7), 0px 8px 8px -4px rgba(0, 0, 0, 0.4);
```

### Shadow Usage Guidelines

| Context | Shadow | Notes |
|---------|--------|-------|
| Form Inputs | `shadow-xs` | On focus states |
| Cards at Rest | `shadow-sm` | Default shadow |
| Dropdowns & Menus | `shadow-md` | Elevated elements |
| Modals & Dialogs | `shadow-lg` to `shadow-xl` | Overlay content |
| Toast Notifications | `shadow-lg` | Floating elements |

**Design Philosophy:** Prefer flat sections with dividers over elevated cards. Only use shadows when an element truly needs to appear above the page surface.

---

## Border Radius

### Radius Scale

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-none` | 0px | Sharp corners |
| `rounded-xs` | 2px | Very subtle, tags |
| `rounded-sm` | 4px | Small elements, badges, chips |
| `rounded` | 6px | **Default for most UI** |
| `rounded-md` | 8px | Buttons, inputs, small cards |
| `rounded-lg` | 12px | Cards, panels, containers |
| `rounded-xl` | 16px | Large cards, modals |
| `rounded-2xl` | 24px | Hero sections, large panels |
| `rounded-3xl` | 32px | Feature cards, marketing |
| `rounded-full` | 9999px | Avatars, circular buttons, pills |

### Component Radius Guidelines

| Component | Radius | Notes |
|-----------|--------|-------|
| Buttons | `rounded-sm` (4px) | Standard for all button sizes |
| Inputs & Selects | `rounded-lg` (12px) | Slightly larger for form fields |
| Cards | `rounded-lg` (12px) | Default for card containers |
| Modals & Dialogs | `rounded-xl` (16px) | Larger for overlay elements |
| Tags & Badges | `rounded` or `rounded-full` | Small radius or pills |
| Avatars | `rounded-full` | Always circular |
| Tooltips | `rounded-md` (8px) | Subtle rounding |
| Progress Bars | `rounded-full` | Fully rounded track and fill |

---

## Motion & Animation

### Duration Tokens

| Token | Value | Usage |
|-------|-------|-------|
| instant | 0ms | Immediate state changes |
| fast | 100ms | Micro-interactions, button feedback |
| **normal** | **200ms** | **DEFAULT - Most UI transitions** |
| slow | 300ms | Panel slides, modal entrances |
| slower | 400ms | Complex animations |
| slowest | 500ms | Elaborate sequences |

### Easing Curves

| Token | CSS | Usage |
|-------|-----|-------|
| **ease-out** | `cubic-bezier(0.0, 0.0, 0.2, 1)` | **DEFAULT - Elements entering** |
| ease-in | `cubic-bezier(0.4, 0.0, 1, 1)` | Elements exiting |
| ease-in-out | `cubic-bezier(0.4, 0.0, 0.2, 1)` | Elements staying on screen |
| linear | `cubic-bezier(0.0, 0.0, 1.0, 1.0)` | Progress indicators |

### Common Animation Patterns

```css
/* Button hover */
transition-colors duration-200 ease-out

/* Card elevation */
transition-shadow duration-200 ease-out

/* Fade in (entering) */
transition-opacity duration-200 ease-out

/* Fade out (exiting) */
transition-opacity duration-100 ease-in

/* Scale transform */
transition-transform duration-200 ease-out hover:scale-110

/* Slide panel (entering) */
transition-transform duration-300 ease-out

/* Slide panel (exiting) */
transition-transform duration-200 ease-in
```

### Motion Rules

**Do:**
- Use 200ms as default duration
- Use ease-out for elements entering
- Keep animations subtle and purposeful
- Respect `prefers-reduced-motion`
- Be specific with transition properties

**Don't:**
- Use animations longer than 500ms for UI feedback
- Animate layout properties (width, height, margin, padding)
- Use `transition-all` unnecessarily
- Create animations that flash or strobe
- Make animations that block user interaction

### Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Dark Mode

### Theme Toggle

Dark mode is enabled via a `.dark` class on the `<html>` element:

```html
<html class="dark">
```

### Surface Colors (CSS Variables)

Surfaces get LIGHTER as they elevate in dark mode (opposite of light mode).

| Token | Light Mode | Dark Mode |
|-------|------------|-----------|
| `--surface-base` | `#ffffff` | `#111827` (neutral-900) |
| `--surface-raised` | `#f9fafb` (neutral-50) | `#1f2937` (neutral-800) |
| `--surface-overlay` | `#f3f4f6` (neutral-100) | `#374151` (neutral-700) |
| `--surface-sunken` | `#f3f4f6` (neutral-100) | `#030712` (neutral-950) |

### Text Colors (CSS Variables)

| Token | Light Mode | Dark Mode |
|-------|------------|-----------|
| `--text-primary` | `#111827` (neutral-900) | `#f9fafb` (neutral-50) |
| `--text-secondary` | `#374151` (neutral-700) | `#d1d5db` (neutral-300) |
| `--text-tertiary` | `#6b7280` (neutral-500) | `#9ca3af` (neutral-400) |
| `--text-disabled` | `#9ca3af` (neutral-400) | `#4b5563` (neutral-600) |
| `--text-inverse` | `#ffffff` | `#111827` (neutral-900) |

### Border Colors (CSS Variables)

| Token | Light Mode | Dark Mode |
|-------|------------|-----------|
| `--border-default` | `#e5e7eb` (neutral-200) | `#374151` (neutral-700) |
| `--border-subtle` | `#f3f4f6` (neutral-100) | `#1f2937` (neutral-800) |
| `--border-strong` | `#d1d5db` (neutral-300) | `#4b5563` (neutral-600) |

### Using Semantic Tokens

```html
<!-- Automatically adapts to light/dark mode -->
<div class="bg-surface-base text-content-primary border-stroke">
  <h2 class="text-content-primary">Title</h2>
  <p class="text-content-secondary">Description</p>
</div>
```

### Manual Dark Mode Variants

When semantic tokens aren't enough:

```html
<div class="bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100">
```

### Dark Mode Checklist

- [ ] Tested in both light and dark modes
- [ ] Contrast ratios verified (WCAG AA)
- [ ] No hardcoded light-only or dark-only styles
- [ ] No `bg-white`, `bg-neutral-50` without `dark:` variants
- [ ] Shadows more prominent in dark mode

---

## Components

### Button Component

**Variants:**
- `filled` (default): Solid `main-700` background, white text - primary actions
- `outlined`: Border only, transparent background - secondary actions
- `ghost`: No border or background - tertiary actions

**Sizes:**

| Size | Height | Padding | Text |
|------|--------|---------|------|
| `sm` | 28px | 12px horizontal | 12px |
| `md` (default) | 36px | 16px horizontal | 14px |
| `lg` | 44px | 20px horizontal | 16px |

**States:** default, hover, focus, active, disabled, loading

**Styling:**
```css
/* Base */
inline-flex items-center justify-center
rounded-sm font-medium
transition-colors duration-150
focus-visible:ring-2 focus-visible:ring-main-500 focus-visible:ring-offset-2

/* Filled (default) */
bg-main-700 text-white
hover:bg-main-900 active:bg-main-950

/* Outlined */
border border-main-700 text-content-primary bg-transparent
hover:bg-main-50 hover:border-main-900

/* Ghost */
text-content-primary bg-transparent
hover:bg-main-50
```

**Destructive Variant:** Replace `main` with `error` colors.

### Input Component

- Height: 40px (medium), 36px (small)
- Padding: `px-3 py-2` (12px × 8px)
- Border radius: `rounded-lg` (12px)
- Border: `border-stroke` (1px)
- Focus: `ring-2 ring-main-500 border-main-500`

### Card Component

- Padding: `p-4` (16px)
- Border radius: `rounded-lg` (12px)
- Border: `border-stroke-subtle`
- Shadow: `shadow-sm` at rest, `shadow-md` on hover (optional)
- Background: `bg-surface-raised`

### Select/Dropdown

- Same dimensions as Input
- Dropdown panel: `shadow-md`, `rounded-lg`
- Options: `py-2`, hover `bg-main-50 dark:bg-main-950`

### Tags/Badges

- Padding: `px-2 py-0.5` (8px × 2px)
- Border radius: `rounded` (6px) or `rounded-full` for pills
- Text: `text-label` (12px)
- Colors: Semantic backgrounds (`success-50`, `error-50`, etc.) with matching text

### Callout/Alert

- Padding: `p-4` (16px)
- Border radius: `rounded-lg` (12px)
- Left border: 4px colored by type
- Types: `info`, `success`, `warning`, `error`

---

## Layout Patterns

### Page Structure

```
┌─────────────────────────────────────────────────────┐
│ Header (h-14, bg-surface-base, border-b)            │
├──────────┬──────────────────────────────────────────┤
│ Sidebar  │ Main Content Area                        │
│ (w-56)   │ ┌──────────────────────────────────────┐ │
│          │ │ Page Header (px-6 py-4)              │ │
│          │ ├──────────────────────────────────────┤ │
│          │ │ Section (px-6 py-4, border-b)        │ │
│          │ ├──────────────────────────────────────┤ │
│          │ │ Section (px-6 py-4, border-b)        │ │
│          │ ├──────────────────────────────────────┤ │
│          │ │ Section (px-6 py-4) - last, no border│ │
│          │ └──────────────────────────────────────┘ │
└──────────┴──────────────────────────────────────────┘
```

### Standard Section Pattern

```html
<div class="px-6 py-4 border-b border-stroke-subtle">
  <h2 class="text-h4 text-content-primary mb-3">Section Title</h2>
  <p class="text-body-regular text-content-secondary mb-4">Description</p>
  <!-- Content -->
</div>
```

### Grid Patterns

```html
<!-- 3-column responsive grid -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

<!-- 4-column stats grid -->
<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">

<!-- 2-column form layout -->
<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
```

### Sidebar Widths

- Expanded: 224px (w-56 / 14rem)
- Collapsed: 56px (w-14 / 3.5rem)

---

## Accessibility

### Requirements

- **WCAG 2.1 AA** compliance required
- **Keyboard navigation** - all interactive elements focusable
- **Focus indicators** - visible ring on focus
- **Color contrast** - 4.5:1 for text, 3:1 for UI
- **Reduced motion** - respect `prefers-reduced-motion`
- **Screen reader support** - semantic HTML, aria labels

### Focus Ring Pattern

```css
focus:outline-none
focus-visible:ring-2
focus-visible:ring-main-500
focus-visible:ring-offset-2
```

### Minimum Touch Target

- 44px × 44px for mobile
- 36px minimum for desktop

---

## Implementation Guide

### Tailwind CSS Configuration

```typescript
// tailwind.config.ts
export default {
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        // MAIN - Change this for different brands
        main: {
          50: "#eff6ff",   // Blue for Metrics Hub
          100: "#dbeafe",
          300: "#93c5fd",
          500: "#3b82f6",
          700: "#1d4ed8",
          900: "#1e3a8a",
          950: "#172554",
        },
        // ... accent colors, neutral, semantic colors
        // (See Color System section for full values)

        // Semantic tokens (CSS variable-based)
        surface: {
          base: "var(--surface-base)",
          raised: "var(--surface-raised)",
          overlay: "var(--surface-overlay)",
          sunken: "var(--surface-sunken)",
        },
        content: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          tertiary: "var(--text-tertiary)",
          disabled: "var(--text-disabled)",
        },
        stroke: {
          DEFAULT: "var(--border-default)",
          subtle: "var(--border-subtle)",
          strong: "var(--border-strong)",
        },
      },
      fontSize: {
        // See Typography section for full scale
        "h1": ["22px", { lineHeight: "1.3", fontWeight: "600" }],
        "h2": ["20px", { lineHeight: "1.3", fontWeight: "600" }],
        // ...
        "body-regular": ["14px", { lineHeight: "1.5", fontWeight: "400" }],
        "label": ["12px", { lineHeight: "1.4", fontWeight: "400" }],
      },
      borderRadius: {
        xs: "2px",
        sm: "4px",
        DEFAULT: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        "2xl": "24px",
      },
    },
  },
}
```

### CSS Variables Setup

```css
/* main.css */
@layer base {
  :root {
    --surface-base: #ffffff;
    --surface-raised: #f9fafb;
    --surface-overlay: #f3f4f6;
    --surface-sunken: #f3f4f6;

    --text-primary: #111827;
    --text-secondary: #374151;
    --text-tertiary: #6b7280;
    --text-disabled: #9ca3af;

    --border-default: #e5e7eb;
    --border-subtle: #f3f4f6;
    --border-strong: #d1d5db;

    --shadow-sm: 0px 1px 3px rgba(16, 24, 40, 0.1),
                 0px 1px 2px rgba(16, 24, 40, 0.06);
    /* ... other shadows */
  }

  .dark {
    --surface-base: #111827;
    --surface-raised: #1f2937;
    --surface-overlay: #374151;
    --surface-sunken: #030712;

    --text-primary: #f9fafb;
    --text-secondary: #d1d5db;
    --text-tertiary: #9ca3af;
    --text-disabled: #4b5563;

    --border-default: #374151;
    --border-subtle: #1f2937;
    --border-strong: #4b5563;

    --shadow-sm: 0px 1px 3px rgba(0, 0, 0, 0.4),
                 0px 1px 2px rgba(0, 0, 0, 0.3);
    /* ... other shadows */
  }
}
```

### Quick Start Checklist

1. [ ] Install Inter font from Google Fonts
2. [ ] Configure Tailwind with color tokens
3. [ ] Set up CSS variables for semantic tokens
4. [ ] Configure dark mode (`darkMode: "class"`)
5. [ ] Create base component library (Button, Input, Card, etc.)
6. [ ] Test light and dark modes
7. [ ] Verify WCAG AA contrast compliance
8. [ ] Test keyboard navigation and focus states

---

## Summary: Key Differences for Metrics Hub

| Aspect | Roofing8020 | Metrics Hub |
|--------|-------------|-------------|
| Main Color | Green (`#22c55e`) | **Blue (`#3b82f6`)** |
| Primary Button | `bg-main-700` (green) | `bg-main-700` (blue) |
| Links | `text-main-700` (green) | `text-main-700` (blue) |
| Focus Ring | `ring-main-500` (green) | `ring-main-500` (blue) |

Everything else (typography, spacing, shadows, border radius, motion, neutral colors, accent colors, semantic colors, dark mode behavior) stays **exactly the same**.

---

*This document is the source of truth for 8020 brand visual design. When in doubt, refer to these specifications.*
