# Design System Documentation Agent

This skill automatically maintains the Axis Design System documentation when new components are created or modified.

## Quick Start

### Invoke the Agent

When you create a new component, simply ask:

```
"Update the design system docs"
```

Or:

```
"I just created AxisModal, please update the documentation"
```

### Manual Check

Run the automated check script:

```bash
./.claude/skills/design-system-docs/update-docs.sh
```

This will:
- Scan all components in `src/components/axis/`
- Compare with `docs/DESIGN_SYSTEM.md`
- Report any missing or outdated documentation

## What Gets Updated

The agent updates:

1. **`docs/DESIGN_SYSTEM.md`** - Main design system documentation
   - Adds new component sections
   - Updates component props and usage examples
   - Maintains consistent formatting

2. **`docs/component-catalog.json`** - (Future) Structured component data
   - Machine-readable component metadata
   - Used for in-platform documentation page

## Agent Workflow

```
User creates component → Agent detects → Reads component code →
Extracts props/variants → Generates docs → Updates DESIGN_SYSTEM.md →
Prepares component catalog
```

## Documentation Standards

Every component gets:

- **Purpose** - What the component does
- **Props Interface** - TypeScript definition
- **Variants** - Different styles/behaviors
- **Usage Examples** - Basic and advanced
- **Accessibility Notes** - WCAG compliance, keyboard nav
- **Dark Mode Support** - How it adapts

## File Structure

```
.claude/skills/design-system-docs/
├── skill.md              # Agent instructions
├── update-docs.sh        # Automated check script
├── README.md             # This file
└── templates/
    └── component.md      # Component doc template
```

## Future: In-Platform Docs

The agent prepares for a future in-platform documentation page at `/design-system`:

**Features:**
- Interactive component playground
- Live code previews
- Dark mode toggle
- Copy code snippets
- Search and filter
- Props documentation

**Implementation:**
- Create page at `src/app/design-system/page.tsx`
- Read from `docs/component-catalog.json`
- Render interactive examples using actual components

## Commands

```bash
# Check documentation completeness
./.claude/skills/design-system-docs/update-docs.sh

# View current components
find src/components/axis -name "*.tsx" | sort

# Count components
find src/components/axis -name "*.tsx" | wc -l
```

## Examples

### Example 1: New Component Created

**User:** "I created AxisModal component"

**Agent:**
1. Reads `src/components/axis/AxisModal.tsx`
2. Extracts props, variants, types
3. Adds section to `docs/DESIGN_SYSTEM.md`
4. Includes usage examples
5. Responds: "✅ Added AxisModal to design system documentation"

### Example 2: Component Modified

**User:** "I added a 'size' prop to AxisButton"

**Agent:**
1. Reads updated `AxisButton.tsx`
2. Updates props interface in docs
3. Adds new usage examples showing size variants
4. Responds: "✅ Updated AxisButton documentation with size prop"

### Example 3: Regular Audit

**User:** "Check if all components are documented"

**Agent:**
1. Scans `src/components/axis/`
2. Compares with `docs/DESIGN_SYSTEM.md`
3. Reports:
   - Total components: 17
   - Documented: 15
   - Missing: AxisModal, AxisDropdown
4. Offers to add missing docs

## Best Practices

1. **Run after component creation** - Don't wait to document
2. **Keep examples realistic** - Use actual use cases
3. **Test code examples** - Ensure they compile
4. **Include edge cases** - Disabled states, loading states, etc.
5. **Accessibility first** - Always document ARIA attributes

## Troubleshooting

**Problem:** Component exists but not documented
- **Solution:** Run `./.claude/skills/design-system-docs/update-docs.sh` to identify gaps

**Problem:** Documentation out of sync with code
- **Solution:** Invoke agent with "Update docs for ComponentName"

**Problem:** Need to document props change
- **Solution:** "I updated ComponentName props, please update docs"

## Integration with Workflow

Recommended workflow:

```
1. Create new component → src/components/axis/AxisNewComponent.tsx
2. Write component code → Props, variants, logic
3. Invoke agent → "Update design system docs"
4. Agent adds documentation → docs/DESIGN_SYSTEM.md
5. Review and commit → Both code and docs in same commit
```

## Maintenance

The agent maintains:
- Alphabetical component ordering
- Consistent formatting
- Up-to-date props interfaces
- Valid TypeScript examples
- Accessibility compliance notes

---

**Questions?** Check `skill.md` for full agent instructions.
