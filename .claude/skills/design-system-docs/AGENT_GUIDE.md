# Design System Documentation Agent - Usage Guide

This is a **Claude Code skill** that automatically maintains design system documentation for the 8020REI Analytics Dashboard.

---

## What This Agent Does

**Primary Function:** Keeps design system documentation synchronized with the actual Axis components in the codebase.

**Documentation Targets:**
1. `docs/DESIGN_SYSTEM.md` - Primary markdown documentation
2. `public/design-kit.html` - Interactive HTML Design Kit (accessible via the Design Kit button in the app header)

**Triggers:**
1. New component created in `src/components/axis/`
2. Existing component significantly modified
3. User explicitly requests documentation update
4. Regular documentation audits

**Outputs:**
- Updated `docs/DESIGN_SYSTEM.md` with complete component documentation
- Updated `public/design-kit.html` with new component cards and previews
- (Future) `docs/component-catalog.json` for structured data

---

## How to Use This Agent

### Method 1: Direct Request

Simply ask Claude Code to update the docs:

```
"Update the design system documentation"
```

```
"I just created AxisModal, please document it"
```

```
"Check if all Axis components are documented"
```

### Method 2: Automated Check

Run the shell script manually:

```bash
./.claude/skills/design-system-docs/update-docs.sh
```

This will scan components and report missing documentation.

### Method 3: After Component Creation

Workflow:
1. Create new component: `src/components/axis/AxisNewComponent.tsx`
2. Write the component code
3. Ask Claude: "Update design system docs with AxisNewComponent"
4. Agent reads component, generates documentation, updates DESIGN_SYSTEM.md
5. Review and commit both code and docs together

---

## Current Status

**Components Found:** 12 Axis components
**Documented:** 0 (basic list only)
**Missing Full Docs:** All 12 components need detailed documentation

### Components Requiring Documentation:

1. ✅ **AxisButton** - Listed in docs, needs full documentation
2. ✅ **AxisInput** - Listed in docs, needs full documentation
3. ✅ **AxisSelect** - Listed in docs, needs full documentation
4. ✅ **AxisCard** - Listed in docs, needs full documentation
5. ✅ **AxisCallout** - Listed in docs, needs full documentation
6. ✅ **AxisTable** - Listed in docs, needs full documentation
7. ✅ **AxisPill** - Listed in docs, needs full documentation
8. ✅ **AxisTag** - Listed in docs, needs full documentation
9. ❌ **AxisNavigationTab** - Not documented
10. ❌ **AxisCheckbox** - Not documented
11. ❌ **AxisSkeleton** - Not documented
12. ❌ **AxisToggle** - Not documented

---

## Documentation Standards

Every component gets:

### 1. Component Header
```markdown
### ComponentName
**Purpose:** One-sentence description
**Category:** Interactive | Layout | Feedback | Data Display | Navigation
```

### 2. Variants Section
List all visual/behavioral variants with descriptions

### 3. Props Interface
Full TypeScript interface copied from source code

### 4. Usage Examples
- Basic usage (minimal props)
- Advanced usage (multiple props)
- Real-world patterns from actual app

### 5. States
Default, Hover, Focus, Active, Disabled, Loading

### 6. Accessibility
Keyboard nav, ARIA attributes, screen reader support, focus indicators

### 7. Dark Mode
How component adapts, which tokens are used

### 8. Design Tokens
List of Axis tokens used in the component

### 9. Common Patterns
Frequent usage scenarios from codebase

### 10. Do's and Don'ts
Best practices and anti-patterns

### 11. Related Components
Links to similar or complementary components

---

## Agent Capabilities

### What the Agent Can Do

✅ **Scan components** - Find all Axis components in codebase
✅ **Read component source** - Extract props, variants, types
✅ **Generate documentation** - Create complete component docs
✅ **Update DESIGN_SYSTEM.md** - Add new sections, maintain formatting
✅ **Update design-kit.html** - Add component cards with previews
✅ **Identify gaps** - Find undocumented or outdated components
✅ **Create examples** - Generate realistic usage examples
✅ **Maintain consistency** - Follow existing documentation style
✅ **Prepare for in-platform docs** - Create structured data for future UI

### What the Agent Cannot Do

❌ Create the components themselves
❌ Modify component source code
❌ Build the in-platform documentation page (yet)
❌ Run automated tests on components
❌ Generate Storybook stories

---

## File Structure

```
8020rei-analytics/
├── .claude/skills/design-system-docs/       # THIS AGENT
│   ├── skill.md                             # Agent instructions
│   ├── README.md                            # Quick start guide
│   ├── AGENT_GUIDE.md                       # This file
│   ├── update-docs.sh                       # Automated check script
│   └── templates/
│       └── component.md                     # Documentation template
│
├── docs/
│   ├── DESIGN_SYSTEM.md                     # MAIN DOCUMENTATION (UPDATE TARGET #1)
│   └── component-catalog.json               # (Future) Structured data
│
├── public/
│   └── design-kit.html                      # HTML DESIGN KIT (UPDATE TARGET #2)
│
└── src/
    ├── components/
    │   ├── axis/                            # MONITORED DIRECTORY
    │   │   ├── AxisButton.tsx
    │   │   ├── AxisInput.tsx
    │   │   ├── AxisSelect.tsx
    │   │   ├── ... (12 components total)
    │   │   └── [new components go here]
    │   ├── DesignKitButton.tsx              # Opens design-kit.html
    │   └── dashboard/
    │       └── [app-specific components]
    │
    └── app/
        └── design-system/                   # (Future) In-platform docs page
            └── page.tsx
```

---

## Workflow Examples

### Example 1: New Component Created

**Scenario:** Developer creates `AxisModal.tsx`

```tsx
// src/components/axis/AxisModal.tsx
export interface AxisModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'small' | 'medium' | 'large'
}

export function AxisModal({ isOpen, onClose, title, children, size = 'medium' }: AxisModalProps) {
  // ... implementation
}
```

**User asks:** "I created AxisModal, update the docs"

**Agent does:**
1. Reads `src/components/axis/AxisModal.tsx`
2. Extracts props: `isOpen`, `onClose`, `title`, `children`, `size`
3. Identifies variants: sizes (small, medium, large)
4. Generates usage examples:
   ```tsx
   // Basic modal
   <AxisModal isOpen={isOpen} onClose={handleClose} title="Confirm Action">
     <p>Are you sure you want to proceed?</p>
   </AxisModal>
   ```
5. Adds accessibility notes: focus trap, ESC key, ARIA labels
6. Documents dark mode behavior
7. Adds new section to `docs/DESIGN_SYSTEM.md`
8. Confirms: "✅ Added AxisModal to design system documentation"

### Example 2: Component Modified

**Scenario:** Developer adds `variant` prop to `AxisButton`

**Before:**
```tsx
interface AxisButtonProps {
  children: React.ReactNode
  onClick?: () => void
}
```

**After:**
```tsx
interface AxisButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'filled' | 'outlined' | 'ghost' // NEW
}
```

**User asks:** "Updated AxisButton with variants, please update docs"

**Agent does:**
1. Reads updated `AxisButton.tsx`
2. Compares with existing documentation
3. Updates props interface in docs
4. Adds variant descriptions:
   - `filled` - Primary actions
   - `outlined` - Secondary actions
   - `ghost` - Tertiary actions
5. Adds new usage examples showing variants
6. Updates existing examples to include variant prop
7. Confirms: "✅ Updated AxisButton documentation with variant prop"

### Example 3: HTML Design Kit Update

**User asks:** "Update the Design Kit HTML with the new component"

**Agent does:**
1. Reads `public/design-kit.html`
2. Identifies where to add the new component card (in the `#components` section)
3. Creates HTML markup for the component preview and info
4. Adds interactive preview (if applicable)
5. Lists all props as `<span class="prop-tag">` elements
6. Updates the component count in the footer
7. Updates the "Last updated" date
8. Confirms: "Updated design-kit.html with AxisNewComponent"

### Example 4: Documentation Audit

**User asks:** "Check if all components are documented"

**Agent does:**
1. Scans `src/components/axis/`
2. Finds: 12 components
3. Reads `docs/DESIGN_SYSTEM.md`
4. Compares lists
5. Reports:
   ```
   📊 Documentation Status:
   - Total components: 12
   - Fully documented: 8
   - Partially documented: 2
   - Missing documentation: 2

   ❌ Missing full docs:
   - AxisToggle
   - AxisSkeleton

   📝 Would you like me to add the missing documentation?
   ```
6. If user approves, documents the missing components

---

## Future: In-Platform Documentation Page

### Phase 1: Component Catalog (Current)
- Generate `docs/component-catalog.json`
- Structure component metadata
- Prepare for UI consumption

### Phase 2: Documentation Page
- Create `src/app/design-system/page.tsx`
- Build component browser UI
- Interactive component playground

### Phase 3: Advanced Features
- Live code editor
- Copy code snippets
- Dark mode preview toggle
- Search and filter
- Direct links to GitHub source

**Example Structure:**
```tsx
// src/app/design-system/page.tsx
import componentCatalog from '@/docs/component-catalog.json'

export default function DesignSystemPage() {
  return (
    <div className="grid grid-cols-[250px_1fr]">
      <Sidebar components={componentCatalog.components} />
      <ComponentPreview />
    </div>
  )
}
```

**UI Features:**
- Search: "button", "input", "modal"
- Filter by category: Interactive, Layout, Feedback
- Live preview with editable props
- Code snippet copy button
- Light/dark mode toggle
- Link to source code on GitHub

---

## Commands Reference

```bash
# Check documentation status
./.claude/skills/design-system-docs/update-docs.sh

# List all Axis components
find src/components/axis -name "*.tsx" -type f | sort

# Count components
find src/components/axis -name "*.tsx" -type f | wc -l

# Search for component in docs
grep "^### Axis" docs/DESIGN_SYSTEM.md
```

---

## Best Practices

### For Developers

1. **Document as you build** - Don't wait until the end
2. **Run the check script** - Before committing
3. **Review generated docs** - Agent is smart but verify examples
4. **Keep props documented** - Add JSDoc comments to component props
5. **Test examples** - Ensure code examples actually work

### For the Agent

1. **Read before writing** - Always read component source first
2. **Use actual types** - Copy TypeScript interfaces exactly
3. **Generate realistic examples** - Based on actual app usage
4. **Maintain consistency** - Match existing documentation style
5. **Verify accessibility** - Check WCAG compliance
6. **Test dark mode** - Ensure components adapt properly

---

## Troubleshooting

### Problem: Agent doesn't detect new component

**Possible Causes:**
- Component not in `src/components/axis/` directory
- Filename doesn't start with `Axis`
- File extension is not `.tsx`

**Solution:**
- Ensure component is in correct location
- Follow naming convention: `AxisComponentName.tsx`
- Run check script to verify detection

### Problem: Generated documentation is incorrect

**Possible Causes:**
- Component source changed after docs generation
- Props interface not exported
- Complex types not properly extracted

**Solution:**
- Re-run agent to regenerate docs
- Verify props interface is exported
- Manually review and adjust if needed

### Problem: Examples don't compile

**Possible Causes:**
- Agent inferred incorrect prop types
- Missing imports in examples
- Semantic token not available

**Solution:**
- Test examples in actual codebase
- Update examples manually if needed
- Report issue to improve agent

---

## Maintenance

The agent is self-maintaining. To keep it up to date:

1. **Regular audits** - Run check script weekly
2. **After major changes** - Update docs when refactoring components
3. **Before releases** - Ensure docs match code
4. **Review PRs** - Include docs updates in component PRs

---

## Quick Reference

| Task | Command |
|------|---------|
| Update all docs | "Update design system documentation" |
| Document new component | "I created AxisModal, document it" |
| Check status | `./.claude/skills/design-system-docs/update-docs.sh` |
| List components | `find src/components/axis -name "*.tsx"` |
| View template | `cat .claude/skills/design-system-docs/templates/component.md` |

---

**Questions?** Read the detailed instructions in `skill.md`.

**Created:** February 10, 2026
**Last Updated:** February 10, 2026
