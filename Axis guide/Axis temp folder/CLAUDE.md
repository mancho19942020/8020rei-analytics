# Axis Design System - Portable Package

This folder contains the **Axis Design System**, a portable UI component library and design token system built for **Nuxt 4 (Vue 3) + TailwindCSS** projects.

---

## What's Inside

```
Axis temp folder/
├── CLAUDE.md                          # This file (rules for Claude)
├── tailwind.config.ts                 # All design tokens (colors, typography, spacing, shadows)
├── components/axis/                   # 30+ production Vue 3 components
│   ├── AxisButton.vue
│   ├── AxisInput.vue
│   ├── AxisSelect.vue
│   ├── AxisCallout.vue
│   ├── AxisTable.vue
│   ├── AxisCard.vue
│   ├── ... (see full list below)
│   ├── card/                          # Card sub-components
│   ├── table/                         # Table sub-components
│   └── icons/                         # Icon components
├── composables/
│   └── useTheme.ts                    # Dark mode toggle composable
├── pages/design-system/               # Living documentation (20+ pages)
│   ├── colors.vue
│   ├── typography.vue
│   ├── spacing.vue
│   └── components/                    # Per-component docs
└── .claude/skills/                    # Claude AI skills for building & validating
    ├── frontend-component-builder/    # Templates, patterns, quick-reference
    └── qa-design-system/              # Audit rules, validation scripts
```

---

## How to Use in a New Project

### 1. Prerequisites
Your project must use:
- **Nuxt 4** (or Vue 3 with Vite)
- **TailwindCSS**
- **Inter font** (add to `nuxt.config.ts` or CSS)

Install icon dependency:
```bash
npm install @heroicons/vue
```

### 2. Copy Into Your Project
```bash
# Components
cp -R "Axis temp folder/components/axis/" your-project/frontend/components/axis/

# Tailwind config (merge with yours or replace)
cp "Axis temp folder/tailwind.config.ts" your-project/frontend/tailwind.config.ts

# Theme composable
cp "Axis temp folder/composables/useTheme.ts" your-project/frontend/composables/

# Design system docs (optional - living documentation)
cp -R "Axis temp folder/pages/design-system/" your-project/frontend/pages/design-system/

# Claude skills (optional - for AI-assisted development)
cp -R "Axis temp folder/.claude/skills/" your-project/.claude/skills/
```

### 3. Add CSS Variables for Dark Mode
Your project needs these CSS variables defined (in `assets/css/main.css` or equivalent):

```css
:root {
  /* Surface */
  --surface-base: #ffffff;
  --surface-raised: #f9fafb;
  --surface-overlay: #ffffff;
  --surface-sunken: #f3f4f6;

  /* Text */
  --text-primary: #111827;
  --text-secondary: #4b5563;
  --text-tertiary: #9ca3af;
  --text-disabled: #d1d5db;
  --text-inverse: #ffffff;

  /* Borders */
  --border-default: #e5e7eb;
  --border-subtle: #f3f4f6;
  --border-strong: #d1d5db;

  /* Shadows */
  --shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
}

.dark {
  --surface-base: #111827;
  --surface-raised: #1f2937;
  --surface-overlay: #1f2937;
  --surface-sunken: #030712;

  --text-primary: #f9fafb;
  --text-secondary: #d1d5db;
  --text-tertiary: #6b7280;
  --text-disabled: #374151;
  --text-inverse: #111827;

  --border-default: #374151;
  --border-subtle: #1f2937;
  --border-strong: #4b5563;

  --shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
  --shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px -1px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -4px rgba(0, 0, 0, 0.3);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.3);
}
```

---

## Axis Design System Rules (MANDATORY)

**Axis** is the design system. **Violations are bugs.** These rules are non-negotiable.

### Core Principles

1. **Scalability First** - Works across multiple brands
2. **Semantic Naming** - Use `main` not `green`, `content-primary` not `neutral-800`
3. **Token Standards** - Follow design system token conventions
4. **Dark Mode Required** - ALL components must support both themes
5. **Axis Is Law** - Design system rules are non-negotiable

---

### Colors

- Semantic tokens: `main`, `accent-1` through `accent-5`, `neutral`, `success`, `alert`, `error`, `info`
- Dark mode tokens: `surface-base`, `surface-raised`, `content-primary`, `content-secondary`, `content-tertiary`, `stroke`, `stroke-subtle`
- **Never use raw color names** like `blue`, `green`, `red`

### Typography

- Headlines: `text-h1` (22px), `text-h2` (20px), `text-h3` (18px), `text-h4` (16px), `text-h5` (14px)
- Body: `text-body-large` (16px), `text-body-regular` (14px)
- Labels: `text-label` (12px), `text-suggestion` (10px)
- **Minimum readable size:** 14px for body text, 12px for labels

### Contrast

WCAG AA required: 4.5:1 for text, 3:1 for UI elements.

### Motion

Default `duration-200 ease-out`, respect `prefers-reduced-motion`.

---

### Dark Mode (MANDATORY)

**All components MUST work in both light and dark modes.**

**Prefer semantic tokens:**
```vue
<div class="bg-surface-base text-content-primary border-stroke">
  <h2 class="text-content-primary">Title</h2>
  <p class="text-content-secondary">Description</p>
</div>
```

**Manual variants when needed:**
```vue
<div class="bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100">
```

**Checklist before committing:**
- [ ] Tested in both light and dark modes
- [ ] Contrast ratios verified (WCAG AA)
- [ ] No hardcoded light-only or dark-only styles
- [ ] No `bg-white`, `bg-neutral-50` without `dark:` variants

---

### Axis Components (MANDATORY)

**All UI elements MUST use Axis components. NEVER use raw HTML elements.**

| Component | Use For |
|-----------|---------|
| `AxisButton` | All buttons (actions, navigation) |
| `AxisInput` | Text inputs (text, email, password, search) |
| `AxisSelect` | Dropdowns (single/multiple selection) |
| `AxisCallout` | Contextual feedback (info, success, warning, error) |
| `AxisCheckbox` | Multiple selections, yes/no choices |
| `AxisRadio` | Single selection from 2-5 options |
| `AxisToggle` | Instant settings (enable/disable features) |
| `AxisTable` | Data tables with sorting, filtering, pagination |
| `AxisCard` | Content containers (with header, body, footer, media) |
| `AxisAccordion` | Expandable/collapsible content sections |
| `AxisBreadcrumb` | Navigation breadcrumbs |
| `AxisPill` | Status indicators, badges |
| `AxisTag` | Labels, categories |
| `AxisSlider` | Range selection |
| `AxisStepper` | Multi-step workflows |
| `AxisToast` | Temporary notifications |
| `AxisSkeleton` | Loading placeholders |
| `AxisStarRating` | Rating input/display |
| `AxisPhoneInput` | Phone number input |
| `AxisAutocomplete` | Search with suggestions |
| `AxisNavigationTab` | Tab navigation |
| `AxisButtonGroup` | Grouped button actions |

**Quick Examples:**
```vue
<!-- Button -->
<AxisButton variant="outlined" :icon-left="PlusIcon">Add Item</AxisButton>

<!-- Input -->
<AxisInput v-model="email" type="email" label="Email" :error="errorMsg" />

<!-- Select -->
<AxisSelect v-model="value" :options="options" label="Type" multiple searchable />

<!-- Callout -->
<AxisCallout type="success" title="Success!" dismissible>
  Changes saved successfully.
</AxisCallout>

<!-- Table -->
<AxisTable :columns="columns" :data="rows" sortable paginated />
```

**NEVER use:**
- Raw `<button>`, `<input>`, `<select>`, `<textarea>` elements
- Custom styled form elements
- Inline callout patterns with `p-4 bg-{type}-50 border`

---

### SSR & Hydration (for Nuxt projects)

1. **Use `useId()` for IDs** - Never use `Math.random()` for generating IDs
2. **Use `isMounted` pattern** for client-only conditional rendering:

```typescript
const isMounted = ref(false);
onMounted(() => { isMounted.value = true; });

const showContent = computed(() => {
  if (!isMounted.value) return false;
  return someClientOnlyValue.value;
});
```

---

### Component Naming Conventions

- Components: PascalCase (`AppHeader.vue`, `UserMenu.vue`)
- Axis Components: Prefixed with `Axis` (`AxisButton.vue`, `AxisInput.vue`)
- Composables: camelCase with `use` prefix (`useAuth.ts`, `useTheme.ts`)
- Pages: kebab-case (`design-system/colors.vue`)

---

## Brand Customization

To rebrand Axis for a different project, change these values in `tailwind.config.ts`:

1. **`main` color palette** - Replace green shades with your brand color
2. **`accent-1` through `accent-5`** - Adjust accent palettes as needed
3. **`fontFamily.sans`** - Change from Inter to your brand font
4. **CSS variables** - Update light/dark mode values in your CSS

Everything else (component structure, tokens, patterns) stays the same.
