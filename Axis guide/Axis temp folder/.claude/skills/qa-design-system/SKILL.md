---
name: qa-design-system
description: Validate frontend code against the Axis design system for compliance with foundations (colors, typography, spacing), components (AxisButton, AxisInput, AxisSelect, AxisCallout), styles (motion, shadows, borders), patterns (layout, accessibility), and all design system rules. Use when (1) frontend code has been written or modified and needs validation, (2) user explicitly requests design system validation or compliance check, (3) reviewing code for violations before PR or commit, or (4) auditing platform-wide adherence to design system standards.
---

# QA Design System

Validate frontend Vue components against the Axis design system to ensure compliance with all mandatory rules for colors, typography, components, accessibility, motion, and layout patterns.

## When to Use This Skill

Use this skill:
1. **After frontend development** - Automatically validate newly written or modified Vue files
2. **On explicit request** - User asks to "check design system compliance" or "validate against Axis"
3. **Before commits/PRs** - Pre-commit validation to catch violations early
4. **Platform audits** - Comprehensive validation across multiple files or directories

## Validation Process

### Step 1: Identify Scope

Determine what needs validation:
- **Single file**: Validate one specific component or page
- **Directory**: Validate all Vue files in a directory (e.g., `frontend/components/`)
- **Full platform**: Validate entire frontend codebase

Ask user if scope is unclear: "Should I validate this specific file, or scan the entire frontend directory?"

### Step 2: Run Automated Scanner

Execute the violation scanner script:

```bash
python .claude/skills/qa-design-system/scripts/scan_violations.py <directory> --format markdown
```

**Parameters:**
- `<directory>`: Path to scan (e.g., `frontend/`, `frontend/components/`, `frontend/pages/`)
- `--format`: Output format (`markdown`, `json`, or `text`)

**Example:**
```bash
# Scan entire frontend
python .claude/skills/qa-design-system/scripts/scan_violations.py frontend/ --format markdown

# Scan specific directory
python .claude/skills/qa-design-system/scripts/scan_violations.py frontend/components/ --format markdown
```

The scanner automatically detects:
- Raw HTML elements (`<button>`, `<input>`, `<select>`)
- Non-semantic color tokens (`bg-blue-500`, `text-green-700`)
- Hardcoded text sizes (`text-xl`, `text-2xl`)
- Low contrast color combinations
- Missing ARIA labels on interactive elements
- Motion violations (`transition-all`, excessive durations)

### Step 3: Manual Review for Context-Specific Rules

The automated scanner cannot detect all violations. Manually review for:

**Color Semantic Meaning:**
- Is `error` used only for errors (not decorative red)?
- Is `success` used only for success states (not decorative green)?
- Is `main` used for primary brand actions (not randomly)?

**Typography Hierarchy:**
- Do headings follow logical order (h2 → h3 → h4, not h2 → h5)?
- Is body text consistently `text-body-regular` or `text-body-large`?
- Are labels consistently `text-label`?

**Component Props:**
- Do `AxisButton` components have proper variants (`filled`, `outlined`, `ghost`)?
- Do icon-only buttons have `aria-label` attributes?
- Do `AxisInput` components have `label` props?
- Do `AxisSelect` components have proper `:options` arrays?

**Accessibility Beyond ARIA:**
- Can all interactive elements be reached with keyboard?
- Is focus state visible on all interactive elements?
- Do form inputs have associated labels?

**Motion & Animation:**
- Do animations respect `prefers-reduced-motion`?
- Are transitions smooth and not jarring?
- Are loading states clear and not infinite?

### Step 4: Cross-Reference Design System Documentation

For comprehensive validation, check implementation against live design system docs:

**Key documentation pages:**
- Colors: `frontend/pages/design-system/colors.vue`
- Typography: `frontend/pages/design-system/typography.vue`
- Motion: `frontend/pages/design-system/motion.vue`
- Components:
  - `frontend/pages/design-system/components/buttons.vue`
  - `frontend/pages/design-system/components/inputs.vue`
  - `frontend/pages/design-system/components/select.vue`
  - `frontend/pages/design-system/components/callouts.vue`
- Accessibility: `frontend/pages/design-system/accessibility.vue`

Read these files to verify edge cases and advanced patterns.

### Step 5: Generate Structured Report

Use the report template format (`assets/report-template.md`) to create a comprehensive validation report.

**Report structure:**
1. **Executive Summary**: High-level overview of findings
2. **Critical Issues**: Must-fix violations (blocking)
3. **Warnings**: Should-fix issues (non-blocking)
4. **Suggestions**: Nice-to-have improvements

**For each issue, include:**
- File path and line number (e.g., `frontend/components/UserMenu.vue:42`)
- Category (colors, typography, components, accessibility, motion, layout)
- Severity (critical, warning, suggestion)
- Rule violated
- Current code snippet
- Recommended fix with code example
- Reference to design system documentation

**Example issue:**

```markdown
### frontend/components/UserMenu.vue:42

**Category:** components
**Severity:** critical
**Rule:** Raw HTML button element

**Current Implementation:**
```vue
<button class="px-4 py-2 bg-main-500 text-white rounded">
  Save
</button>
```

**Recommended Fix:**
```vue
<AxisButton>Save</AxisButton>
```

**Explanation:** All button elements must use the `AxisButton` component. Raw `<button>` elements violate the design system component standards.

**Reference:** CLAUDE.md - Axis Components (MANDATORY), frontend/pages/design-system/components/buttons.vue
```

### Step 6: Provide Actionable Summary

End the report with:
1. **Total violation count** by severity
2. **Most common violations** (help identify patterns)
3. **Recommended priority** (fix critical first, then warnings, then suggestions)
4. **Next steps** for the user or fixer agent

**Example summary:**

```markdown
## Summary

**Total Violations:** 23
- 🚨 Critical: 12 (must fix)
- ⚠️  Warnings: 8 (should fix)
- 💡 Suggestions: 3 (nice to have)

**Most Common Issues:**
1. Raw HTML buttons (7 occurrences) → Replace with AxisButton
2. Non-semantic color tokens (5 occurrences) → Use main, neutral, success, error, etc.
3. Missing aria-label on icon buttons (4 occurrences) → Add aria-label prop

**Recommended Priority:**
1. Fix all 12 critical issues (raw components, accessibility)
2. Address 8 warnings (typography, motion)
3. Consider 3 suggestions for future improvement

**Next Steps:**
Pass this report to the fixer agent or frontend-dev-expert to implement the recommended fixes.
```

## Validation Rules Reference

For comprehensive validation rules, see `references/design-system-rules.md`.

**Quick reference:**

| Category | Key Rules |
|----------|-----------|
| **Colors** | Use semantic tokens only (main, neutral, success, error, alert, info, accent-1 to accent-5). Never use raw color names (blue, green, red, etc.) |
| **Typography** | Use typography tokens (text-h1 to text-h5, text-body-large/regular, text-label, text-suggestion). Never use raw text sizes (text-xl, text-2xl, etc.) |
| **Components** | Use Axis components (AxisButton, AxisInput, AxisSelect, AxisCallout). Never use raw HTML elements |
| **Accessibility** | All interactive elements need ARIA labels. Maintain WCAG AA contrast (4.5:1 for text, 3:1 for large text) |
| **Motion** | Default 200ms duration, specific properties only (not transition-all), respect prefers-reduced-motion |
| **Layout** | Follow standard section patterns (px-6 py-4), respect sidebar state |

## Common Violations & Fixes

### Raw HTML Button

❌ **Violation:**
```vue
<button class="px-4 py-2 bg-main-500 text-white rounded">Save</button>
```

✅ **Fix:**
```vue
<AxisButton>Save</AxisButton>
```

### Non-Semantic Color

❌ **Violation:**
```vue
<div class="bg-blue-500 text-white">...</div>
```

✅ **Fix:**
```vue
<div class="bg-main-500 text-white">...</div>
```

### Hardcoded Text Size

❌ **Violation:**
```vue
<h2 class="text-2xl font-semibold">Title</h2>
```

✅ **Fix:**
```vue
<h2 class="text-h2 text-neutral-800">Title</h2>
```

### Missing ARIA Label

❌ **Violation:**
```vue
<AxisButton icon-only :icon-left="PlusIcon" />
```

✅ **Fix:**
```vue
<AxisButton icon-only :icon-left="PlusIcon" aria-label="Add item" />
```

### Low Contrast Text

❌ **Violation:**
```vue
<p class="text-neutral-400">Body text</p>
```

✅ **Fix:**
```vue
<p class="text-body-regular text-neutral-700">Body text</p>
```

### Non-Specific Transition

❌ **Violation:**
```vue
<div class="transition-all duration-200">...</div>
```

✅ **Fix:**
```vue
<div class="transition-colors duration-200 ease-out">...</div>
```

## Severity Guidelines

**Critical (🚨)**: Must be fixed before merge
- Raw HTML elements instead of Axis components
- Non-semantic color tokens
- Low contrast text (fails WCAG AA)
- Missing ARIA labels on interactive elements
- Animating layout properties

**Warning (⚠️)**: Should be fixed, non-blocking
- Hardcoded text sizes instead of tokens
- `transition-all` instead of specific properties
- Long animation durations (< 1s but > 500ms)
- Missing `motion-safe` variants

**Suggestion (💡)**: Nice to have
- Inconsistent spacing patterns
- Non-standard naming conventions
- Missing documentation comments

## Example Validation Workflow

**User request:** "I just finished building the UserProfile component. Can you check if it follows our design system?"

**Your response:**

1. Identify scope: Single file (`frontend/components/UserProfile.vue`)
2. Run scanner: `python .claude/skills/qa-design-system/scripts/scan_violations.py frontend/components/ --format markdown`
3. Review scanner output for violations
4. Manually review the file for context-specific issues
5. Cross-reference with design system docs if needed
6. Generate structured report with findings
7. Provide actionable summary and next steps

**Example report excerpt:**

```markdown
# Design System Validation Report: UserProfile.vue

**Total Violations:** 4
**Critical:** 2 | **Warnings:** 2 | **Suggestions:** 0

## 🚨 Critical Issues

### frontend/components/UserProfile.vue:23
**Category:** components
**Rule:** Raw HTML button element
[... detailed violation info ...]

### frontend/components/UserProfile.vue:45
**Category:** accessibility
**Rule:** Missing aria-label on icon button
[... detailed violation info ...]

## Summary
Fix 2 critical issues before merge. The component uses raw HTML elements that should be replaced with Axis components, and icon buttons need aria-label attributes for accessibility.

**Next Steps:** Pass this report to the frontend-dev-expert agent to implement fixes.
```

## Tools & Scripts

### Automated Scanner

**Location:** `scripts/scan_violations.py`

**Capabilities:**
- Scans Vue files recursively
- Detects raw HTML elements
- Identifies non-semantic colors
- Finds hardcoded text sizes
- Checks for low contrast
- Detects missing ARIA labels
- Finds motion violations

**Limitations:**
- Cannot detect semantic meaning of colors
- Cannot validate logical typography hierarchy
- Cannot check keyboard navigation
- Cannot validate component prop correctness

**Usage:**
```bash
# Scan with markdown output
python scripts/scan_violations.py frontend/ --format markdown

# Scan with JSON output (for parsing)
python scripts/scan_violations.py frontend/ --format json

# Scan with plain text output
python scripts/scan_violations.py frontend/ --format text
```

### Manual Review Checklist

Use this checklist for manual validation:

- [ ] Color tokens used semantically (error=errors, success=success)
- [ ] Typography hierarchy is logical (h2→h3→h4, no skips)
- [ ] All Axis components have proper props
- [ ] Icon-only buttons have aria-label
- [ ] Form inputs have associated labels
- [ ] Interactive elements are keyboard accessible
- [ ] Focus states are visible
- [ ] Animations respect prefers-reduced-motion
- [ ] Loading states are clear and finite
- [ ] Contrast ratios meet WCAG AA (4.5:1)

## Resources

### Scripts
- `scripts/scan_violations.py`: Automated violation scanner

### References
- `references/design-system-rules.md`: Comprehensive validation rules and search patterns

### Assets
- `assets/report-template.md`: Structured report format template

## Important Notes

1. **Always run the scanner first** - It catches 80% of violations automatically
2. **Manual review is essential** - Scanner cannot detect semantic/contextual issues
3. **Provide file:line references** - Makes it easy for fixers to locate issues
4. **Include code examples** - Show both violation and fix
5. **Prioritize by severity** - Critical must be fixed, warnings should be fixed, suggestions are optional
6. **Reference documentation** - Link to CLAUDE.md or design-system pages for each rule
7. **Be specific** - "Replace `<button>` with `<AxisButton>`" not "Use correct component"
8. **Pass to fixer** - This skill produces reports, not fixes. Hand off to frontend-dev-expert or fixer agent.
