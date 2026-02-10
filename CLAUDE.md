# 8020METRICS HUB - Project Instructions

## Overview

This is the 8020METRICS HUB analytics dashboard built with Next.js 16, React, and the Axis Design System.

---

## CRITICAL: Dashboard Builder Skill

**When building ANY new dashboard tabs, sections, or widgets, you MUST consult and follow the Dashboard Builder Skill:**

📍 **Location:** `.claude/skills/dashboard-builder/SKILL.md`

This skill contains all the established patterns, rules, and corrections that MUST be followed to ensure consistency. Key points:

1. **Tailwind color classes don't work reliably** - Use custom CSS classes (`light-gray-bg`, `selected-tab-line`, etc.)
2. **Light/dark mode has specific rules** - Navigation/toolbar/content use gray in light mode, unified dark in dark mode
3. **Widget patterns must be followed** - Export support, settings support, proper shadows
4. **Color tokens are limited** - Only use defined shades (50, 100, 300, 500, 700, 900, 950)

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx          # Main dashboard page
│   ├── globals.css       # Custom CSS classes (light-gray-bg, selected-tab-*, etc.)
│   └── api/              # API routes
├── components/
│   ├── axis/             # Axis Design System components
│   └── workspace/        # Dashboard widgets and grid
├── lib/
│   ├── workspace/        # Layout configurations
│   └── export.ts         # CSV export utilities
└── types/                # TypeScript definitions
```

---

## Quick Reference

### Backgrounds (Light Mode)
- Header: White (default)
- Navigation: `light-gray-bg` class
- Toolbar: `light-gray-bg` class
- Main content: `light-gray-bg` class
- Cards/Widgets: White

### Selected Tabs
Use CSS classes, NOT Tailwind:
- Line variant: `selected-tab-line`
- Contained variant: `selected-tab-contained`

### Widget Shadows
- Default: `shadow-xs`
- Hover: `shadow-sm`

### Edit Mode (Widget Layout)
- **Drag**: Use the handle icon in widget header to reposition
- **Resize**: Drag widget edges (right, bottom) or corner (bottom-right)
- All widgets have min/max size constraints defined in `defaultLayouts.ts`
- Charts automatically adapt to new sizes via ResponsiveContainer

---

## Development Server

```bash
npm run dev -- -p 4000
```

Access at: http://localhost:4000

---

## Before Creating New Features

1. Read `.claude/skills/dashboard-builder/SKILL.md`
2. Follow the component patterns exactly
3. Test in both light and dark modes
4. Use the checklist at the end of the skill document
