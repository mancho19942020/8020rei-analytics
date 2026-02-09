# Design System Quick Reference

This is a condensed reference for the 8020 design system tokens. For full documentation, see `frontend/pages/design-system/`.

## Color Tokens

**CRITICAL: Never use raw color names (blue, green, red). Always use semantic tokens.**

| Token | Purpose | Example |
|-------|---------|---------|
| `main` | Primary brand color | `bg-main-500`, `text-main-700` |
| `accent-1` to `accent-5` | Charts, data viz, variety | `bg-accent-1-500` |
| `neutral` | Text, backgrounds, borders | `text-neutral-900`, `bg-neutral-50` |
| `success` | Positive feedback | `text-success-700`, `bg-success-50` |
| `alert` | Warnings | `text-alert-700`, `bg-alert-50` |
| `error` | Errors, destructive | `text-error-700`, `bg-error-50` |
| `info` | Informational | `text-info-700`, `bg-info-50` |

### Shade Scale

| Shade | Usage |
|-------|-------|
| `50-100` | Light backgrounds, subtle fills |
| `300` | Borders, disabled states |
| `500` | Primary actions, icons |
| `700` | Hover states, emphasis |
| `900-950` | Text, high contrast |

### Contrast Rules (WCAG AA)

| Background | Safe Text Colors |
|------------|-----------------|
| `white` / `neutral-50` | `neutral-900`, `neutral-700` |
| `neutral-100` | `neutral-900`, `neutral-800` |
| `main-50` | `main-900`, `main-700` |
| `error-50` | `error-900`, `error-700` |

**Avoid:**
- `text-{color}-500` on `bg-{color}-50` (too light)
- `text-neutral-400` or lighter for important text
- Any text shade below `600` on light backgrounds

## Typography

### Headings
```
text-h1-alt  - Display heading (largest)
text-h1      - Page title
text-h2      - Section header
text-h3      - Subsection
text-h4      - Card header
text-h5      - Small header
text-h6      - Mini header
text-h7      - Tiny header
```

### Body & Labels
```
text-body-large    - 16px body text
text-body-regular  - 14px body text (default)
text-label         - 12px labels
text-label-bold    - 12px bold labels
text-suggestion    - 10px small text
```

### Buttons
```
text-button-large   - Large button text
text-button-regular - Standard button text
text-button-small   - Small button text
```

## Spacing

Standard section pattern:
```html
<div class="px-6 py-4 border-b border-neutral-100">
  <h2 class="text-h5 text-neutral-900 mb-3">Section Title</h2>
  <!-- Content -->
</div>
```

Common spacing values:
- `p-1` / `m-1` = 4px
- `p-2` / `m-2` = 8px
- `p-3` / `m-3` = 12px
- `p-4` / `m-4` = 16px
- `p-6` / `m-6` = 24px
- `p-8` / `m-8` = 32px

## Border Radius

| Class | Size |
|-------|------|
| `rounded-none` | 0px |
| `rounded-sm` | 2px |
| `rounded` | 6px (default) |
| `rounded-md` | 8px |
| `rounded-lg` | 12px |
| `rounded-xl` | 16px |
| `rounded-full` | 9999px |

## Shadows (Elevation)

```
shadow-none → shadow-xs → shadow-sm → shadow-md → shadow-lg → shadow-xl
```

## Icons

Using Heroicons (outline style). Standard sizes:

| Size | Classes | Pixels |
|------|---------|--------|
| xs | `w-4 h-4` | 16px |
| sm | `w-5 h-5` | 20px |
| md | `w-6 h-6` | 24px |
| lg | `w-8 h-8` | 32px |

## Layout Patterns

### Sidebar-aware content
```vue
<main :class="['pt-12', sidebarExpanded ? 'pl-52' : 'pl-14']">
```

### Full-width (dashboards, tables)
```html
<div class="w-full">
```

### Bounded (forms, docs)
```html
<div class="max-w-5xl mx-auto">
```

## Component Class Patterns

### Buttons
```html
<!-- Primary -->
<button class="bg-main-500 text-white hover:bg-main-700 px-4 py-2 rounded text-button-regular">

<!-- Secondary -->
<button class="bg-neutral-100 text-neutral-900 hover:bg-neutral-200 px-4 py-2 rounded text-button-regular">

<!-- Destructive -->
<button class="bg-error-500 text-white hover:bg-error-700 px-4 py-2 rounded text-button-regular">
```

### Cards
```html
<div class="bg-white border border-neutral-200 rounded-lg shadow-sm p-4">
```

### Inputs
```html
<input class="w-full px-3 py-2 border border-neutral-300 rounded text-body-regular focus:border-main-500 focus:ring-1 focus:ring-main-500" />
```

### Status badges
```html
<span class="bg-success-50 text-success-700 px-2 py-1 rounded text-label">Active</span>
<span class="bg-error-50 text-error-700 px-2 py-1 rounded text-label">Failed</span>
<span class="bg-alert-50 text-alert-700 px-2 py-1 rounded text-label">Pending</span>
```
