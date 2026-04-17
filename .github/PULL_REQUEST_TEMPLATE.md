## Summary

<!-- What does this PR do? Briefly describe the changes. -->

## Type of Change

- [ ] New feature
- [ ] Bug fix
- [ ] Refactor / code improvement
- [ ] Documentation update
- [ ] Style / UI change

---

## Design System Compliance Checklist

> **All contributors must verify these items before requesting review.** PRs that fail the automated design system check will be blocked from merging.

### Colors & Tokens

- [ ] I used **CSS custom properties** (`var(--surface-base)`, `var(--text-primary)`, etc.) instead of hardcoded hex colors
- [ ] I used only the **approved color shades**: 50, 100, 300, 500, 700, 900, 950 (NOT 200, 400, 600, 800)
- [ ] I used **semantic color names** (`main-500`, `success-500`, `accent-1-700`) instead of raw Tailwind colors (`blue-500`, `green-600`)
- [ ] I did NOT use unreliable Tailwind color classes like `bg-neutral-100`, `bg-gray-200`, `text-main-500` — used CSS classes instead

### Layout & Backgrounds

- [ ] Gray backgrounds use the `light-gray-bg` CSS class (NOT Tailwind `bg-gray-*`)
- [ ] Tab selection uses `selected-tab-line` or `selected-tab-contained` CSS classes
- [ ] Widget cards use `bg-surface-base` with `shadow-xs` (hover: `shadow-sm`)
- [ ] No pure black (`#000000`) backgrounds in dark mode — use `var(--surface-base)` (#0e1421)

### Dark Mode

- [ ] All new UI elements support dark mode (either via CSS variables or `dark:` variants)
- [ ] Dark mode backgrounds use `var(--surface-base)` (#0e1421), never `#000`

### Components

- [ ] I reused existing Axis components from `src/components/axis/` where applicable
- [ ] New widgets follow the Widget wrapper pattern and are registered in the widgets index
- [ ] No unnecessary new components — checked existing ones first

### General

- [ ] `npm run lint` passes with no errors
- [ ] `npm run build` succeeds
- [ ] I tested in both light and dark mode (if UI changes)

---

## Screenshots (if UI changes)

<!-- Add before/after screenshots for visual changes -->

| Light Mode | Dark Mode |
|------------|-----------|
|            |           |

---

## Additional Notes

<!-- Anything reviewers should know? -->
