# Design Tokens Reference - 8020REI Analytics

**Complete reference of all design tokens implemented from the Axis Design System.**

Last Updated: February 10, 2026

---

## Token Implementation Status

✅ **All Axis Design System tokens are fully implemented in `src/app/globals.css`**

This project uses **Tailwind CSS v4** with the inline `@theme` directive for token management.

---

## Color Tokens

### Main Brand Color (Blue)

Primary brand color for the analytics dashboard:

| Token | Hex Value | Usage |
|-------|-----------|-------|
| `main-50` | `#eff6ff` | Light backgrounds, subtle highlights |
| `main-100` | `#dbeafe` | Hover backgrounds, badges |
| `main-300` | `#93c5fd` | Borders, disabled states |
| `main-500` | `#3b82f6` | Icons, secondary elements |
| `main-700` | `#1d4ed8` | **Primary buttons, links** ⭐ |
| `main-900` | `#1e3a8a` | Hover states, emphasis |
| `main-950` | `#172554` | Dark backgrounds |

**Usage:**
```tsx
className="bg-main-700 text-white"        // Primary button
className="text-main-700"                 // Links
className="border-main-500"               // Focus rings
```

---

### Accent Colors (Data Visualization)

Twelve accent palettes for charts, dashboards, and variety. Each has shades: 50, 100, 300, 500, 700, 900, 950.

| Accent | Color Family | Primary Use |
|--------|--------------|-------------|
| **accent-1** | Blue | Primary data series, charts |
| **accent-2** | Indigo/Purple | Secondary data, highlights |
| **accent-3** | Orange | Alerts, attention metrics |
| **accent-4** | Lime | Growth, positive trends |
| **accent-5** | Pink/Magenta | Special categories |
| **accent-6** | Teal/Cyan | Tertiary data series |
| **accent-7** | Rose/Coral | Critical metrics, alerts |
| **accent-8** | Amber/Gold | Warnings, caution indicators |
| **accent-9** | Emerald/Green | Success, positive metrics |
| **accent-10** | Violet/Purple | Alternative category |
| **accent-11** | Sky/Light Blue | Informational data |
| **accent-12** | Slate/Cool Gray | Neutral, disabled states |

**Usage:**
```tsx
className="bg-accent-1-500"   // Chart bars
className="text-accent-3-700" // Warning metric
className="bg-accent-6-500"   // Teal for tertiary series
```

---

### Chart Colors (Optimized for Data Visualization)

12 primary colors designed for maximum contrast and accessibility in charts and graphs.

| Token | Color | Hex | Usage |
|-------|-------|-----|-------|
| `chart-1` | Blue | `#3b82f6` | Primary data series |
| `chart-2` | Green | `#22c55e` | Success, positive values |
| `chart-3` | Orange | `#f97316` | Attention, warnings |
| `chart-4` | Violet | `#8b5cf6` | Secondary series |
| `chart-5` | Pink | `#ec4899` | Highlights |
| `chart-6` | Teal | `#14b8a6` | Tertiary series |
| `chart-7` | Amber | `#f59e0b` | Warnings, caution |
| `chart-8` | Red | `#ef4444` | Errors, negative values |
| `chart-9` | Indigo | `#6366f1` | Alternative series |
| `chart-10` | Lime | `#84cc16` | Positive alternative |
| `chart-11` | Sky | `#0ea5e9` | Info, neutral data |
| `chart-12` | Slate | `#64748b` | Neutral, disabled |

**Usage:**
```tsx
// Recharts example
<Bar dataKey="value" fill="var(--color-chart-1)" />
<Line stroke="var(--color-chart-2)" />

// Tailwind
className="bg-chart-1"  // Blue
className="bg-chart-5"  // Pink
```

---

### Sequential Color Scales

For heatmaps, gradients, and intensity-based visualizations.

| Scale | Colors (1-5, light to dark) | Usage |
|-------|---------------------------|-------|
| **Blue** | `seq-blue-1` to `seq-blue-5` | Cold, water, technology |
| **Green** | `seq-green-1` to `seq-green-5` | Positive, growth, nature |
| **Orange** | `seq-orange-1` to `seq-orange-5` | Warm, attention |
| **Red** | `seq-red-1` to `seq-red-5` | Hot, negative, danger |

**Usage:**
```tsx
// Heatmap cells
className="bg-seq-blue-1"  // Lightest (low value)
className="bg-seq-blue-5"  // Darkest (high value)
```

---

### Diverging Color Scale

For data with positive/negative values or above/below threshold comparisons.

| Token | Color | Usage |
|-------|-------|-------|
| `diverge-neg-2` | Dark Red (#b91c1c) | Strong negative |
| `diverge-neg-1` | Light Red (#f87171) | Mild negative |
| `diverge-neutral` | Gray (#9ca3af) | Zero/neutral |
| `diverge-pos-1` | Light Green (#4ade80) | Mild positive |
| `diverge-pos-2` | Dark Green (#15803d) | Strong positive |

**Usage:**
```tsx
// Comparison charts, YoY changes
className={value > 0 ? "bg-diverge-pos-1" : "bg-diverge-neg-1"}
```

---

### Neutral Scale (Gray)

11 shades for text, backgrounds, and borders:

| Token | Hex | Light Mode Usage | Dark Mode Usage |
|-------|-----|------------------|-----------------|
| `neutral-50` | `#f9fafb` | Light backgrounds | — |
| `neutral-100` | `#f3f4f6` | Raised surfaces | — |
| `neutral-200` | `#e5e7eb` | Borders | — |
| `neutral-300` | `#d1d5db` | Strong borders | Secondary text |
| `neutral-400` | `#9ca3af` | Disabled text | Tertiary text |
| `neutral-500` | `#6b7280` | Tertiary text | — |
| `neutral-600` | `#4b5563` | — | Disabled text |
| `neutral-700` | `#374151` | Secondary text | Borders |
| `neutral-800` | `#1f2937` | — | Raised surfaces |
| `neutral-900` | `#111827` | Primary text | Base background |
| `neutral-950` | `#030712` | — | Sunken surfaces |

---

### Semantic Status Colors

Each has 7 shades: 50, 100, 300, 500, 700, 900, 950.

| Color | Purpose | Key Shades |
|-------|---------|------------|
| **success** | Positive feedback, confirmations | Green (`#22c55e`) |
| **alert** | Warnings, cautions | Yellow (`#eab308`) |
| **error** | Errors, destructive actions | Red (`#ef4444`) |
| **info** | Informational, neutral | Cyan (`#06b6d4`) |

**Note on Info Type Colors:**
The `AxisCallout` component uses `accent-1-*` (blue) tokens for the "info" type instead of `info-*` (cyan) tokens. This provides better contrast and visual consistency in light mode.

**Usage Pattern:**
```tsx
// Light backgrounds with dark text
className="bg-success-50 dark:bg-success-950 text-success-700 dark:text-success-400"

// Direct color usage
className="text-error-700"        // Error text
className="border-alert-500"      // Warning border

// AxisCallout info type uses accent-1 colors
className="bg-accent-1-50 dark:bg-accent-1-950 text-accent-1-700 dark:text-accent-1-300"
```

---

### Semantic Theme Tokens (CSS Variables)

These automatically adapt to light/dark mode via CSS variables.

#### Surface Colors

| Token | Light Value | Dark Value | Usage |
|-------|-------------|------------|-------|
| `surface-base` | `#ffffff` | `#111827` | Main page background |
| `surface-raised` | `#f9fafb` | `#1f2937` | Cards, elevated elements, **dark mode content area** |
| `surface-overlay` | `#f3f4f6` | `#374151` | Modals, popovers |
| `surface-sunken` | `#f3f4f6` | `#030712` | Inset areas |

**Usage:**
```tsx
className="bg-surface-base"       // Auto-adapts to theme
className="bg-surface-raised"     // Cards
```

#### Main Content Area Background

The main content area uses a special pattern to achieve the desired visual effect:

```tsx
// Main content area pattern (February 2026 update)
className="bg-neutral-100 dark:bg-surface-raised"
```

| Mode | Background | Hex | Effect |
|------|------------|-----|--------|
| Light | `bg-neutral-100` | `#f3f4f6` | Subtle gray, easier on eyes than white |
| Dark | `bg-surface-raised` | `#1f2937` | Dark gray, consistent with navigation |

**Why not pure semantic tokens?**
This pattern intentionally uses `neutral-100` in light mode (instead of `surface-base`) because:
- Pure white (`#ffffff`) is harsh and causes eye strain
- Subtle gray provides better contrast for card "floating" effect
- Cards using `bg-surface-base` appear elevated against the gray background

#### Content Colors (Text)

| Token | Light Value | Dark Value | Usage |
|-------|-------------|------------|-------|
| `content-primary` | `#111827` | `#f9fafb` | Headings, primary text |
| `content-secondary` | `#374151` | `#d1d5db` | Body text |
| `content-tertiary` | `#6b7280` | `#9ca3af` | Labels, metadata |
| `content-disabled` | `#9ca3af` | `#4b5563` | Disabled state |
| `content-inverse` | `#ffffff` | `#111827` | Text on colored backgrounds |

**Usage:**
```tsx
className="text-content-primary"     // Auto-adapts
className="text-content-secondary"   // Supporting text
```

#### Stroke Colors (Borders)

| Token | Light Value | Dark Value | Usage |
|-------|-------------|------------|-------|
| `stroke` | `#e5e7eb` | `#374151` | Default borders |
| `stroke-subtle` | `#f3f4f6` | `#1f2937` | Subtle dividers |
| `stroke-strong` | `#d1d5db` | `#4b5563` | Emphasized borders |

**Usage:**
```tsx
className="border-stroke"         // Standard border
className="border-stroke-strong"  // Emphasized
```

---

## Typography Tokens

### Font Family

```css
font-family: 'Inter', system-ui, sans-serif;
```

**Weights:** 400 (Regular), 500 (Medium), 600 (SemiBold)

---

### Typography Scale

All typography uses semantic class names (not raw Tailwind sizes).

#### Headlines

| Token | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `text-h1-alt` | 24px (1.5rem) | 600 | 1.3 | Hero sections |
| `text-h1` | 22px (1.375rem) | 600 | 1.3 | Page titles |
| `text-h2` | 20px (1.25rem) | 600 | 1.3 | Section titles |
| `text-h3` | 18px (1.125rem) | 600 | 1.35 | Subsections |
| `text-h4` | 16px (1rem) | 600 | 1.4 | Component titles |
| `text-h5` | 14px (0.875rem) | 600 | 1.4 | Small headers |
| `text-h6` | 12px (0.75rem) | 500 | 1.4 | Micro headers |
| `text-h7` | 10px (0.625rem) | 600 | 1.4 | Tiny headers |

#### Body Text

| Token | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `text-body-large` | 16px (1rem) | 400 | 1.5 | Lead text |
| `text-body-regular` | 14px (0.875rem) | 400 | 1.5 | **Default body** ⭐ |

#### Buttons

| Token | Size | Weight | Usage |
|-------|------|--------|-------|
| `text-button-large` | 16px (1rem) | 500 | Large buttons |
| `text-button-regular` | 14px (0.875rem) | 500 | **Standard buttons** ⭐ |
| `text-button-small` | 12px (0.75rem) | 500 | Compact buttons |

#### Labels & Links

| Token | Size | Weight | Usage |
|-------|------|--------|-------|
| `text-label` | 12px (0.75rem) | 400 | Form labels |
| `text-label-bold` | 12px (0.75rem) | 500 | Emphasized labels |
| `text-link` | 14px (0.875rem) | 400 | Standard links |
| `text-link-small` | 12px (0.75rem) | 400 | Small links |

#### Small Text

| Token | Size | Weight | Usage |
|-------|------|--------|-------|
| `text-suggestion` | 10px (0.625rem) | 400 | Badges, tags, timestamps |
| `text-suggestion-bold` | 10px (0.625rem) | 600 | Emphasized captions |

**Important:** 10px text is only for non-essential info (badges, timestamps). Never for body content.

---

## Shadow Tokens

Shadows adapt to light/dark mode via CSS variables (darker/more prominent in dark mode).

**Design Principle:** Shadows should be subtle by default, only becoming prominent on hover or in specific interaction states.

| Token | Tailwind Class | Light Mode | Dark Mode | Usage |
|-------|----------------|------------|-----------|-------|
| `shadow-xs` | `shadow-xs` | Subtle | Medium | **Default for widgets/cards** ⭐ |
| `shadow-sm` | `shadow-sm` | Light | Strong | Hover states for cards/widgets |
| `shadow-md` | `shadow-md` | Medium | Stronger | Edit mode hover, dropdowns, popovers |
| `shadow-lg` | `shadow-lg` | Strong | Very strong | Modals, dialogs |
| `shadow-xl` | `shadow-xl` | Very strong | Maximum | Large overlays |

**Note:** Shadow intensity was reduced in the February 2026 update:
- Default widget/card shadows: `shadow-md` → `shadow-xs`
- Hover shadows: `hover:shadow-lg` → `hover:shadow-sm` (normal mode), `hover:shadow-md` (edit mode)
- MetricCard hover: `hover:shadow-md` → `hover:shadow-sm`

**Light Mode Values:**
```css
--shadow-xs: 0px 1px 2px rgba(16, 24, 40, 0.05);
--shadow-sm: 0px 1px 3px rgba(16, 24, 40, 0.1), 0px 1px 2px rgba(16, 24, 40, 0.06);
--shadow-md: 0px 4px 8px -2px rgba(16, 24, 40, 0.1), 0px 2px 4px -2px rgba(16, 24, 40, 0.06);
--shadow-lg: 0px 12px 16px -4px rgba(16, 24, 40, 0.08), 0px 4px 6px -2px rgba(16, 24, 40, 0.03);
--shadow-xl: 0px 20px 24px -4px rgba(16, 24, 40, 0.08), 0px 8px 8px -4px rgba(16, 24, 40, 0.03);
```

**Dark Mode Values:**
```css
--shadow-xs: 0px 1px 2px rgba(0, 0, 0, 0.3);
--shadow-sm: 0px 1px 3px rgba(0, 0, 0, 0.4), 0px 1px 2px rgba(0, 0, 0, 0.3);
--shadow-md: 0px 4px 8px -2px rgba(0, 0, 0, 0.5), 0px 2px 4px -2px rgba(0, 0, 0, 0.3);
--shadow-lg: 0px 12px 16px -4px rgba(0, 0, 0, 0.6), 0px 4px 6px -2px rgba(0, 0, 0, 0.3);
--shadow-xl: 0px 20px 24px -4px rgba(0, 0, 0, 0.7), 0px 8px 8px -4px rgba(0, 0, 0, 0.4);
```

---

## Border Radius Tokens

| Token | Value | Pixels | Usage |
|-------|-------|--------|-------|
| `rounded-xs` | 0.125rem | 2px | Very subtle rounding |
| `rounded-sm` | 0.25rem | 4px | Small elements, badges |
| `rounded` | 0.375rem | 6px | **Default** ⭐ |
| `rounded-md` | 0.5rem | 8px | Buttons, inputs |
| `rounded-lg` | 0.75rem | 12px | Cards, panels |
| `rounded-xl` | 1rem | 16px | Large cards, modals |
| `rounded-2xl` | 1.5rem | 24px | Hero sections |
| `rounded-3xl` | 2rem | 32px | Feature cards |
| `rounded-4xl` | 2.5rem | 40px | Extra large elements |
| `rounded-full` | 9999px | Full | Avatars, pills |

**Common Component Usage:**
- **Buttons:** `rounded-sm` (4px)
- **Inputs:** `rounded-lg` (12px)
- **Cards:** `rounded-lg` (12px)
- **Modals:** `rounded-xl` (16px)
- **Avatars:** `rounded-full`

---

## Spacing Tokens

Uses Tailwind's default spacing scale (base unit: 4px).

### Common Patterns

| Pattern | Classes | Size | Usage |
|---------|---------|------|-------|
| Section Padding | `px-6 py-4` | 24px × 16px | **Standard sections** ⭐ |
| Card Padding | `p-4` | 16px | Card interiors |
| Button Padding | `px-4 py-2` | 16px × 8px | Standard buttons |
| Input Padding | `px-3 py-2` | 12px × 8px | Form inputs |
| Badge Padding | `px-2 py-0.5` | 8px × 2px | Small badges |

### Gap Scale (Flex/Grid)

| Class | Value | Usage |
|-------|-------|-------|
| `gap-1` | 4px | Icon groups |
| `gap-2` | 8px | Tight inline items |
| `gap-3` | 12px | List items |
| `gap-4` | 16px | **Standard grid gap** ⭐ |
| `gap-6` | 24px | Card grids |
| `gap-8` | 32px | Section separations |

---

## Motion Tokens

### Default Transition

```tsx
className="transition-colors duration-200 ease-out"
```

### Duration Scale

- **Fast:** 100ms - Micro-interactions
- **Normal:** 200ms - **Default** ⭐
- **Slow:** 300ms - Panel slides
- **Slower:** 400ms - Complex animations

### Easing Curves

- **ease-out:** Elements entering (default)
- **ease-in:** Elements exiting
- **ease-in-out:** Elements staying on screen

### Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Token Usage Examples

### Complete Component Example

```tsx
export function MetricCard() {
  return (
    <div className="bg-surface-raised border border-stroke rounded-lg shadow-sm p-4">
      <h3 className="text-h4 text-content-primary font-semibold mb-2">
        Total Users
      </h3>
      <div className="text-h1 text-content-primary font-bold">
        1,234
      </div>
      <p className="text-body-regular text-content-secondary">
        Active in last 30 days
      </p>
    </div>
  );
}
```

### Semantic Color Example

```tsx
<div className="bg-success-50 dark:bg-success-950 border border-success-200 dark:border-success-800 rounded-lg p-4">
  <p className="text-success-700 dark:text-success-400">
    Changes saved successfully!
  </p>
</div>
```

---

## Verification Checklist

✅ All color tokens (main, accents 1-12, neutral, semantic, theme CSS variables)
✅ All typography tokens (headlines, body, buttons, labels)
✅ All shadow tokens (xs, sm, md, lg, xl) with light/dark variants
✅ All border radius tokens (xs through 4xl, full)
✅ Spacing scale (Tailwind default)
✅ Motion/transition tokens
✅ Reduced motion support
✅ Dark mode CSS variable system
✅ Blue as main brand color (not green)
✅ Chart colors (chart-1 through chart-12)
✅ Sequential scales (blue, green, orange, red)
✅ Diverging scale (negative to positive)

---

## Related Documentation

- **Design System Guide:** [docs/DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)
- **Theme Best Practices:** [THEME_BEST_PRACTICES.md](../THEME_BEST_PRACTICES.md)
- **Design Kit (HTML):** [public/design-kit.html](../public/design-kit.html)
- **Axis Source:** `Axis guide/Axis temp folder/AXIS_DESIGN_SYSTEM_GUIDE.md`
- **Implementation:** `src/app/globals.css`

---

---

## Recent Changes (February 10, 2026)

### Shadow Token Usage Update

Shadow intensity was reduced for a cleaner visual appearance:

| Component | Previous | Current |
|-----------|----------|---------|
| Widget default | `shadow-md` | `shadow-xs` |
| Widget hover (normal) | `hover:shadow-lg` | `hover:shadow-sm` |
| Widget hover (edit mode) | `hover:shadow-lg` | `hover:shadow-md` |
| MetricCard hover | `hover:shadow-md` | `hover:shadow-sm` |

### AxisCallout Info Type Colors

The "info" type in AxisCallout now uses `accent-1-*` (blue) tokens instead of `info-*` (cyan) tokens for better contrast in light mode:

| Property | Previous | Current |
|----------|----------|---------|
| Background | `info-50/950` | `accent-1-50/950` |
| Text | `info-700/300` | `accent-1-700/300` |
| Accent bar | `info-500` | `accent-1-500` |

### New Props

- `AxisCallout`: Added `hideIcon` prop to optionally hide the type icon

### Data Visualization Color System (February 10, 2026)

Expanded the color system to support complex analytics dashboards:

**New Accent Colors (accent-6 through accent-12):**
| Accent | Color Family | Hex |
|--------|--------------|-----|
| accent-6 | Teal | #14b8a6 |
| accent-7 | Rose | #f43f5e |
| accent-8 | Amber | #f59e0b |
| accent-9 | Emerald | #10b981 |
| accent-10 | Violet | #8b5cf6 |
| accent-11 | Sky | #0ea5e9 |
| accent-12 | Slate | #64748b |

**Chart Colors (chart-1 through chart-12):**
12 optimized colors for data visualization with maximum contrast and accessibility.

**Sequential Scales:**
- `seq-blue-1` to `seq-blue-5`
- `seq-green-1` to `seq-green-5`
- `seq-orange-1` to `seq-orange-5`
- `seq-red-1` to `seq-red-5`

**Diverging Scale:**
- `diverge-neg-2`, `diverge-neg-1`, `diverge-neutral`, `diverge-pos-1`, `diverge-pos-2`

### Design Kit Button

Added Design Kit button to the dashboard header that opens the HTML documentation (`public/design-kit.html`) in a new tab.

---

**Status:** All Axis Design System tokens are fully implemented and verified.
**Last Audit:** February 10, 2026
