# Design System Documentation Agent - Quick Reference

---

## How to Use (3 Simple Ways)

### 1. Just Ask Claude
```
"Update the design system documentation"
"I created AxisModal, please document it"
"Check if all components are documented"
```

### 2. Run the Check Script
```bash
./.claude/skills/design-system-docs/update-docs.sh
```

### 3. After Creating a Component
```
1. Create: src/components/axis/AxisNewComponent.tsx
2. Ask: "Update design system docs with AxisNewComponent"
3. Review: docs/DESIGN_SYSTEM.md
4. Commit: Both code and docs together
```

---

## What the Agent Does

- ✅ Scans `src/components/axis/` for components
- ✅ Reads component code (props, variants, types)
- ✅ Generates complete documentation
- ✅ Updates `docs/DESIGN_SYSTEM.md`
- ✅ Identifies missing documentation
- ✅ Prepares for in-platform docs page

---

## Current Status

**12 Axis components** found
**0 fully documented** (need detailed docs)
**12 need documentation:**

AxisButton, AxisInput, AxisSelect, AxisCard, AxisCallout, AxisTable, AxisPill, AxisTag, AxisNavigationTab, AxisCheckbox, AxisSkeleton, AxisToggle

---

## Files Created

```
.claude/skills/design-system-docs/
├── skill.md              # Agent instructions
├── README.md             # Quick start
├── AGENT_GUIDE.md        # Full usage guide
├── QUICK_REFERENCE.md    # This file
├── update-docs.sh        # Check script
└── templates/
    └── component.md      # Doc template

docs/
├── DESIGN_SYSTEM.md                  # Main docs (AGENT UPDATES THIS)
└── DESIGN_SYSTEM_AGENT_SUMMARY.md    # Overview
```

---

## Commands

```bash
# Check documentation status
./.claude/skills/design-system-docs/update-docs.sh

# List all Axis components
find src/components/axis -name "*.tsx" -type f | sort

# Count components
find src/components/axis -name "*.tsx" | wc -l

# See what's documented
grep "^### Axis" docs/DESIGN_SYSTEM.md
```

---

## Each Component Gets

- Purpose (one sentence)
- Category (Interactive, Layout, Feedback, etc.)
- Variants (primary, secondary, etc.)
- Props Interface (TypeScript)
- Usage Examples (basic + advanced)
- States (default, hover, focus, disabled, etc.)
- Accessibility notes
- Dark mode behavior
- Design tokens used
- Common patterns
- Do's and don'ts
- Related components

---

## Example

**You:** "I created AxisModal, document it"

**Agent:**
1. Reads `src/components/axis/AxisModal.tsx`
2. Extracts props, variants, types
3. Generates usage examples
4. Documents accessibility (focus trap, ESC, ARIA)
5. Documents dark mode
6. Adds section to `docs/DESIGN_SYSTEM.md`
7. Says: "✅ Added AxisModal to design system documentation"

---

## Future: In-Platform Docs

Eventually, you'll have a `/design-system` page in the app with:
- Interactive component playground
- Live code previews
- Copy code snippets
- Search and filter
- Dark mode toggle
- Direct GitHub links

---

## Quick Start

1. Create component in `src/components/axis/`
2. Ask Claude: "Update design system docs"
3. Review generated documentation
4. Commit code + docs together

**That's it!**

---

For more details, see:
- `README.md` - Quick start guide
- `AGENT_GUIDE.md` - Full usage guide
- `docs/DESIGN_SYSTEM_AGENT_SUMMARY.md` - Overview
