---
name: frontend-component-builder
description: Update, improve, and extend Vue 3/Nuxt 4 frontend components following the 8020 design system. Use when modifying existing components, adding new variants to Axis components, implementing features based on design system patterns, fixing component issues, or enhancing component functionality. Also use for creating new components when needed. Enforces TypeScript strict mode, Composition API with script setup, semantic design tokens defined in frontend/pages/design-system/, and clean code practices.
---

# Frontend Component Builder

Update, improve, and extend Vue 3/Nuxt 4 components following the 8020 design system and TypeScript/Vue best practices.

**Primary focus**: Most components are already defined in the design system ([frontend/pages/design-system/](../../frontend/pages/design-system/)). This skill prioritizes improving existing components and implementing patterns from the design system documentation.

## Quick Start

1. **Updating existing components**: Read the component file first, check design system pages for patterns
2. **Adding Axis component variants**: Review existing Axis component, check design system spec page
3. **Creating new components**: Read [references/quick-reference.md](references/quick-reference.md), copy template from [assets/templates/](assets/templates/)

## Component Workflows

### Workflow 1: Update Existing Component

**Use when**: Fixing bugs, adding features, improving existing functionality

1. **Read the component** - Understand current implementation
   ```bash
   # Read the component file
   Read frontend/components/ComponentName.vue
   ```

2. **Check design system documentation** - Find the corresponding design system page
   ```bash
   # Look for specs in design system pages
   Read frontend/pages/design-system/components/component-name.vue
   Read frontend/pages/design-system/patterns/pattern-name.vue
   ```

3. **Make minimal changes** - Only modify what's needed
   - Preserve existing patterns and structure
   - Match current code style
   - Don't refactor unrelated code
   - Use existing design tokens

4. **Verify against design system** - Ensure changes align with documented patterns

### Workflow 2: Extend Axis Component

**Use when**: Adding new variants, sizes, or props to Axis components (AxisButton, AxisInput, AxisSelect, AxisCallout)

1. **Read the Axis component** - Understand current implementation
   ```bash
   Read frontend/components/axis/AxisComponentName.vue
   ```

2. **Read the design system specification** - Check what's documented
   ```bash
   Read frontend/pages/design-system/components/component-name.vue
   ```

3. **Implement following existing patterns**
   - Match prop naming conventions (e.g., `variant`, `size`, `destructive`)
   - Use same TypeScript patterns (interfaces, `withDefaults`)
   - Follow existing computed property structure
   - Maintain semantic design token usage

4. **Update design system page** - Document new variants/props in the corresponding page

### Workflow 3: Create New Component

**Use when**: Building truly new functionality not covered by existing components

1. **Check design system first** - Verify component doesn't already exist or isn't documented
   ```bash
   # Search design system pages
   Glob frontend/pages/design-system/**/*.vue
   ```

2. **Choose starting template**
   | Need | Template |
   |------|----------|
   | UI component | `assets/templates/ComponentName.vue` |
   | Shared state/logic | `assets/templates/useComposableName.ts` |
   | Complex types | `assets/templates/ComponentName.types.ts` |

3. **Implement following this structure**

```vue
<script setup lang="ts">
// 1. TYPES (inline or import)
interface Props { /* ... */ }

// 2. PROPS & EMITS
const props = withDefaults(defineProps<Props>(), {})
const emit = defineEmits<{ /* ... */ }>()

// 3. COMPOSABLES
const { user } = useAuth()

// 4. STATE
const isOpen = ref(false)

// 5. COMPUTED
const isValid = computed(() => /* ... */)

// 6. METHODS
const handleClick = () => { /* ... */ }

// 7. LIFECYCLE (if needed)
onMounted(() => { /* ... */ })
</script>

<template>
  <!-- Semantic HTML + Tailwind with design tokens -->
</template>
```

### 4. Apply design system

**Before writing any styles**, read [references/quick-reference.md](references/quick-reference.md).

Critical rules:
- **Colors**: Use `main`, `neutral`, `success`, `error`, `alert`, `info`, `accent-1-5`. Never `blue`, `green`, `red`.
- **Text contrast**: Body text `neutral-700`+, headings `neutral-900`, never below `600` on light backgrounds.
- **Typography**: Use semantic classes `text-h1-h7`, `text-body-large/regular`, `text-label`.
- **Spacing**: Standard sections use `px-6 py-4`.

### 5. Verify checklist

- [ ] `<script setup lang="ts">` used
- [ ] Props typed with interface + `withDefaults`
- [ ] Emits typed with strict signatures
- [ ] Semantic color tokens only (no raw colors)
- [ ] Text contrast passes WCAG AA
- [ ] Semantic HTML elements
- [ ] Accessibility attributes (aria-*, role where needed)

## File Placement

| Type | Location | Naming |
|------|----------|--------|
| Components | `frontend/components/` | `PascalCase.vue` |
| Feature components | `frontend/components/{feature}/` | `PascalCase.vue` |
| Composables | `frontend/composables/` | `useCamelCase.ts` |
| Pages | `frontend/pages/` | `kebab-case.vue` |
| Types (shared) | `frontend/types/` | `camelCase.ts` |

## Existing Components Reference

### Axis Component Library

**Core reusable components** - These are the building blocks for all UI:

- **[AxisButton.vue](../../frontend/components/axis/AxisButton.vue)** - Buttons with variants (filled/outlined/ghost), sizes, icons, loading states
  - Spec: [frontend/pages/design-system/components/buttons.vue](../../frontend/pages/design-system/components/buttons.vue)
  - Props: `variant`, `size`, `destructive`, `disabled`, `loading`, `iconLeft`, `iconRight`, `iconOnly`, `fullWidth`

- **[AxisInput.vue](../../frontend/components/axis/AxisInput.vue)** - Text inputs with validation, labels, helper text
  - Spec: [frontend/pages/design-system/components/inputs.vue](../../frontend/pages/design-system/components/inputs.vue)
  - Props: `modelValue`, `type`, `label`, `placeholder`, `error`, `helpText`, `disabled`, `required`

- **[AxisSelect.vue](../../frontend/components/axis/AxisSelect.vue)** - Select dropdowns with search, multi-select
  - Props: `modelValue`, `options`, `label`, `placeholder`, `error`, `multiple`, `searchable`

- **[AxisCallout.vue](../../frontend/components/axis/AxisCallout.vue)** - Alert/info boxes with types (info/success/warning/error)
  - Props: `type`, `title`, `hideIcon`

**When to extend vs create**:
- **Extend Axis component** if adding a variant/size/prop that fits the component's purpose
- **Create new component** if functionality is fundamentally different

### Application Components

**Study these for patterns:**
- [AppHeader.vue](../../frontend/components/AppHeader.vue) - Complex component with auth, dropdowns
- [AppSidebar.vue](../../frontend/components/AppSidebar.vue) - Navigation, global state, responsive
- [useAuth.ts](../../frontend/composables/useAuth.ts) - Composable with useState, methods, computed
- [default.vue](../../frontend/layouts/default.vue) - Layout structure with sidebar awareness

## Common Patterns

### Sidebar-aware layout
```vue
<main :class="['pt-12', sidebarExpanded ? 'pl-52' : 'pl-14']">
```

### Section with divider
```vue
<div class="px-6 py-4 border-b border-neutral-100">
  <h2 class="text-h5 text-neutral-900 mb-3">Title</h2>
</div>
```

### Button variants
```html
<!-- Primary -->
<button class="bg-main-500 text-white hover:bg-main-700 px-4 py-2 rounded">

<!-- Secondary -->
<button class="bg-neutral-100 text-neutral-900 hover:bg-neutral-200 px-4 py-2 rounded">
```

### Status badge
```html
<span class="bg-success-50 text-success-700 px-2 py-1 rounded text-label">Active</span>
```

### Form input
```html
<input class="w-full px-3 py-2 border border-neutral-300 rounded focus:border-main-500 focus:ring-1 focus:ring-main-500" />
```

## Design System Documentation (Source of Truth)

The design system pages in `frontend/pages/design-system/` are the **source of truth** for component specifications:

### Core Documentation
- **[Components](../../frontend/pages/design-system/components/)** - Buttons, inputs, selects, modals, alerts, tables, cards, tooltips, checkboxes
- **[Patterns](../../frontend/pages/design-system/patterns/)** - Forms, navigation, data tables, empty states, loading states, error handling
- **[Colors](../../frontend/pages/design-system/colors.vue)** - Semantic color tokens and usage
- **[Typography](../../frontend/pages/design-system/typography.vue)** - Text styles and hierarchy
- **[Spacing](../../frontend/pages/design-system/spacing.vue)** - Layout spacing system
- **[Principles](../../frontend/pages/design-system/principles.vue)** - Design philosophy
- **[Governance](../../frontend/pages/design-system/governance.vue)** - Design system rules and decision-making

### Additional References
- **Design tokens**: [references/quick-reference.md](references/quick-reference.md)
- **Vue/TS patterns**: [references/vue-patterns.md](references/vue-patterns.md)
- **Tailwind config**: [frontend/tailwind.config.ts](../../frontend/tailwind.config.ts)

## Best Practices for Component Work

### When Updating Existing Components

1. **Read first** - Read the component file before making changes
2. **Check design system** - Look for corresponding documentation page
3. **Minimal changes** - Only modify what's needed to achieve the goal
4. **Preserve patterns** - Match existing code structure and conventions
5. **No unnecessary refactoring** - Don't clean up unrelated code
6. **Design tokens only** - Use semantic tokens (`main`, `neutral`, etc.), never raw colors

### When Extending Axis Components

1. **Study the existing component** - Understand its props, variants, structure
2. **Follow established patterns**:
   - Prop naming (e.g., `variant`, `size`, `destructive`, `disabled`, `loading`)
   - TypeScript interfaces with `withDefaults`
   - Computed properties for class composition
   - Semantic design tokens
3. **Update documentation** - Add new variants/props to design system page
4. **Maintain consistency** - New features should feel native to the component

### When Creating New Components

1. **Verify necessity** - Check if existing Axis components can be extended instead
2. **Follow Axis patterns** - Use existing components as templates
3. **Use semantic tokens** - Never use raw color values
4. **Document thoroughly** - Create or update design system page
