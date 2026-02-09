# Design System Validation Report

**Date:** {date}
**Scope:** {scope}
**Total Violations:** {total_violations}
**Critical Issues:** {critical_count}
**Warnings:** {warning_count}
**Suggestions:** {suggestion_count}

---

## Executive Summary

{summary}

---

## 🚨 Critical Issues ({critical_count})

Critical issues must be fixed before merge. These violations break the design system and are considered bugs.

{critical_issues}

---

## ⚠️ Warnings ({warning_count})

Warnings should be addressed but are not blocking. These improve code quality and consistency.

{warning_issues}

---

## 💡 Suggestions ({suggestion_count})

Suggestions are nice-to-have improvements that enhance code quality.

{suggestion_issues}

---

## Issue Template

Use this template for each issue:

### {file_path}:{line_number}

**Category:** {category}
**Severity:** {severity}
**Rule:** {rule_name}

**Current Implementation:**
```vue
{violation_code}
```

**Recommended Fix:**
```vue
{fix_code}
```

**Explanation:** {explanation}

**Reference:** {reference_link}

---

## Next Steps

1. Review all critical issues and prioritize fixes
2. Address warnings where feasible
3. Consider suggestions for future improvements
4. Re-run validation after fixes: `python scripts/scan_violations.py frontend/ --format markdown`
5. Update documentation if new patterns emerge

---

## Categories Reference

| Category | Description |
|----------|-------------|
| **colors** | Color token usage, semantic naming, shade selection |
| **typography** | Text size tokens, hierarchy, readability |
| **components** | Axis component usage vs raw HTML |
| **accessibility** | ARIA labels, contrast ratios, keyboard navigation |
| **motion** | Animation duration, easing, reduced motion support |
| **layout** | Spacing, patterns, responsive design |
| **data-viz** | Chart colors, accessibility, semantic meaning |

---

## Severity Definitions

| Severity | Definition | Action Required |
|----------|------------|-----------------|
| **Critical** | Breaks design system rules, violates accessibility | Must fix before merge |
| **Warning** | Deviates from standards, impacts consistency | Should fix, not blocking |
| **Suggestion** | Improvement opportunity, best practice | Nice to have |
