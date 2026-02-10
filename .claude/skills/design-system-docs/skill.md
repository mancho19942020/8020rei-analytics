# Design System Documentation Agent

**Automatically maintains design system documentation when new components are created or modified.**

---

## Purpose

This agent monitors component creation and automatically updates the design system documentation to keep it synchronized with the actual codebase. It ensures that all reusable components are properly documented with usage examples, props, and design guidelines.

**IMPORTANT:** This agent maintains TWO documentation targets:
1. **Markdown docs** - `docs/DESIGN_SYSTEM.md` (primary documentation)
2. **HTML Design Kit** - `public/design-kit.html` (in-app visual documentation page)

**CRITICAL:** BOTH targets must ALWAYS be updated together. Never update one without the other.

---

## Monitored Directories

**CRITICAL:** This agent monitors ALL component directories in the project. When ANY component is created or modified, BOTH documentation targets must be updated.

| Directory | Component Type | Section in Design Kit | Count |
|-----------|---------------|----------------------|-------|
| `src/components/` (root) | Global Components | Global | 3 |
| `src/components/axis/` | Axis UI Components | Components | 12 |
| `src/components/charts/` | Chart Components | Charts | 3 |
| `src/components/workspace/` | Workspace Components | Workspace | 4 |
| `src/components/workspace/widgets/` | Widget Components | Widgets | 8 |
| `src/components/dashboard/` | Dashboard Components | Dashboard | 6 |

**Total: 36 components** - All must be documented in both targets.

### Component Categories Explained

1. **Global Components** (`src/components/`): App-wide utilities
   - ThemeToggle, Logo, DesignKitButton

2. **Axis UI Components** (`src/components/axis/`): Reusable UI primitives
   - AxisButton, AxisInput, AxisSelect, AxisCard, AxisCallout, etc.

3. **Chart Components** (`src/components/charts/`): Reusable chart wrappers
   - BaseLineChart, BaseHorizontalBarChart, BaseStackedBarChart

4. **Workspace Components** (`src/components/workspace/`): Grid/layout system
   - GridWorkspace, Widget, WidgetCatalog, WidgetSettings

5. **Widget Components** (`src/components/workspace/widgets/`): Dashboard widgets
   - MetricsOverviewWidget, TimeSeriesWidget, BarChartWidget, etc.

6. **Dashboard Components** (`src/components/dashboard/`): Page-level components
   - UsersTab, ClientsTable, Scorecard, TimeSeriesChart, etc.

---

## When to Invoke

Invoke this agent **AUTOMATICALLY** when:

1. **New component created** - ANY new `.tsx` file in ANY of the directories above
2. **Component modified** - Props added/changed, variants added, API changed
3. **User explicitly requests** - "Update design system docs"
4. **After completing a feature** - ALWAYS check if new components were created
5. **After refactoring** - Component renamed, moved, or consolidated

**PROACTIVE BEHAVIOR:** After ANY coding session that creates or modifies components, the agent MUST:
1. Scan all component directories
2. Compare against documented components
3. Update both `docs/DESIGN_SYSTEM.md` AND `public/design-kit.html`
4. Report what was added/updated

---

## What This Agent Does

### 1. Component Discovery
- Scans ALL component directories:
  - `src/components/*.tsx` - Global components (ThemeToggle, Logo, DesignKitButton)
  - `src/components/axis/` - Axis UI components (AxisButton, AxisInput, etc.)
  - `src/components/charts/` - Chart components (BaseLineChart, etc.)
  - `src/components/workspace/` - Workspace components (Widget, GridWorkspace, etc.)
  - `src/components/workspace/widgets/` - Widget components (MetricsOverviewWidget, etc.)
  - `src/components/dashboard/` - Dashboard components (UsersTab, ClientsTable, etc.)
- Identifies new or modified components since last documentation update
- Extracts component props, variants, and usage patterns from TypeScript types
- **Counts total components** and compares against documented count

### 2. Documentation Analysis
- Reads current `docs/DESIGN_SYSTEM.md`
- Compares documented components vs actual components
- Identifies missing or outdated documentation

### 3. Documentation Updates
- Adds new components to the "Components" section
- Generates usage examples based on component props
- Includes TypeScript interface documentation
- Adds accessibility notes and best practices
- Maintains consistent formatting with existing docs

### 4. Component Catalog Preparation
- Generates structured data for future in-platform documentation page
- Creates component metadata (props, variants, examples)
- Prepares JSON/TypeScript data structure for rendering

### 5. HTML Design Kit Updates
- Updates `public/design-kit.html` with new component information
- Adds interactive previews for new components
- Updates the component count in the footer
- Ensures the "Last Updated" date is current

---

## Agent Workflow

```
1. Scan components directory
   └─> List all *.tsx files in src/components/axis/

2. Read component files
   └─> Extract: props, variants, types, comments

3. Compare with docs/DESIGN_SYSTEM.md
   └─> Find: missing components, outdated info

4. Update documentation
   ├─> Add new component sections
   ├─> Update existing sections
   └─> Generate code examples

5. (Future) Update in-platform docs
   └─> Generate component-catalog.json
```

---

## Component Documentation Template

When adding a new component to DESIGN_SYSTEM.md, use this structure:

```markdown
### ComponentName

**Purpose:** [Brief 1-sentence description]

**Variants:**
- `variant1` - Description
- `variant2` - Description

**Props:**
```tsx
interface ComponentProps {
  variant?: 'variant1' | 'variant2'
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
  children: React.ReactNode
}
```

**Usage:**
```tsx
// Basic usage
<ComponentName variant="variant1">
  Content
</ComponentName>

// Advanced usage
<ComponentName
  variant="variant2"
  size="large"
  disabled={isDisabled}
>
  Content
</ComponentName>
```

**Accessibility:**
- [Key accessibility features]
- [ARIA attributes used]
- [Keyboard interactions]

**Dark Mode:**
- Automatically adapts using semantic tokens
- [Any component-specific dark mode notes]
```

---

## File Structure

```
8020rei-analytics/
├── docs/
│   ├── DESIGN_SYSTEM.md              # Main documentation (UPDATE THIS)
│   └── component-catalog.json         # (Future) Structured component data
├── public/
│   └── design-kit.html               # HTML Design Kit (UPDATE THIS TOO!)
├── src/
│   ├── components/
│   │   ├── axis/                      # MONITOR: UI Components
│   │   │   ├── AxisButton.tsx
│   │   │   ├── AxisInput.tsx
│   │   │   └── [other Axis components]
│   │   │
│   │   ├── charts/                    # MONITOR: Chart Components
│   │   │   ├── BaseLineChart.tsx
│   │   │   ├── BaseHorizontalBarChart.tsx
│   │   │   ├── BaseStackedBarChart.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── workspace/                 # MONITOR: Workspace Components
│   │   │   ├── Widget.tsx
│   │   │   ├── GridWorkspace.tsx
│   │   │   └── widgets/
│   │   │
│   │   ├── DesignKitButton.tsx        # Opens design-kit.html in new tab
│   │   └── dashboard/                 # App-specific (not monitored)
│   │
│   └── app/
│       └── design-system/             # (Future) In-platform docs page
│           └── page.tsx
```

---

## Instructions for Agent

When invoked, follow this protocol:

### Step 1: Component Discovery
```bash
# List all Axis components
find src/components/axis -name "*.tsx" -type f | sort

# Count components
echo "Total components found: $(find src/components/axis -name "*.tsx" -type f | wc -l)"
```

### Step 2: Read Each Component
For each component file:
- Read the TypeScript file
- Extract the main component export
- Identify props interface (e.g., `AxisButtonProps`)
- Note any variants or configuration options
- Look for JSDoc comments explaining usage

### Step 3: Analyze Current Documentation
```bash
# Read current docs
cat docs/DESIGN_SYSTEM.md

# Extract list of documented components
grep "^### Axis" docs/DESIGN_SYSTEM.md
```

### Step 4: Identify Gaps
Compare discovered components vs documented components:
- **Missing:** Components in code but not in docs
- **Outdated:** Components with changed props/API
- **Deprecated:** Components in docs but removed from code

### Step 5: Update Documentation

For each **missing** component:
1. Add new section under "Components" heading
2. Follow the component documentation template
3. Generate realistic usage examples
4. Include accessibility and dark mode notes

For each **outdated** component:
1. Update props interface
2. Add new usage examples for new features
3. Update variant descriptions

For each **deprecated** component:
1. Remove from documentation
2. Add note in changelog if exists

### Step 6: Maintain Consistency
- Keep alphabetical order in component list
- Use consistent formatting (match existing style)
- Verify all code examples are valid TypeScript
- Ensure all examples follow design system rules

### Step 7: Update HTML Design Kit

**CRITICAL:** When ANY reusable component changes, ALWAYS update `public/design-kit.html`:

#### For UI Components (src/components/axis/)

Add to the `#components` section:
```html
<div class="component-card">
  <div class="component-preview">
    <!-- Interactive preview of the component -->
  </div>
  <div class="component-info">
    <div class="component-name">AxisNewComponent</div>
    <div class="component-desc">Description of what it does.</div>
    <div class="component-props">
      <span class="prop-tag">propName1</span>
      <span class="prop-tag">propName2</span>
    </div>
  </div>
</div>
```

#### For Chart Components (src/components/charts/)

Add to the `#charts` section (create if missing):
```html
<div class="component-card">
  <div class="component-preview">
    <!-- SVG preview of the chart type -->
    <svg width="200" height="100" viewBox="0 0 200 100">
      <!-- Simple chart visualization -->
    </svg>
  </div>
  <div class="component-info">
    <div class="component-name">BaseLineChart</div>
    <div class="component-desc">Time series line chart with consistent styling and centering.</div>
    <div class="component-props">
      <span class="prop-tag">data</span>
      <span class="prop-tag">color</span>
      <span class="prop-tag">tooltipFormatter</span>
    </div>
  </div>
</div>
```

#### For Workspace Components (src/components/workspace/)

Add to the `#workspace` section (create if missing):
```html
<div class="component-card">
  <div class="component-preview">
    <!-- Preview of the workspace component -->
  </div>
  <div class="component-info">
    <div class="component-name">Widget</div>
    <div class="component-desc">Base wrapper for all dashboard widgets.</div>
    <div class="component-props">
      <span class="prop-tag">title</span>
      <span class="prop-tag">onExport</span>
      <span class="prop-tag">editMode</span>
    </div>
  </div>
</div>
```

#### Always Update These:

1. **Navigation** - Add nav link if new section created:
```html
<li><a href="#charts" class="nav-link">Charts</a></li>
```

2. **Component count** in the footer - Update total count

3. **Last updated date** - Set to current date

4. **Test the HTML** - Open `public/design-kit.html` in browser to verify

### Step 8: Generate Component Catalog (Future)
Create `docs/component-catalog.json`:
```json
{
  "components": [
    {
      "name": "AxisButton",
      "path": "src/components/axis/AxisButton.tsx",
      "category": "Interactive",
      "description": "Primary button component for user actions",
      "props": { ... },
      "variants": ["filled", "outlined", "ghost"],
      "examples": [
        {
          "title": "Primary Button",
          "code": "<AxisButton variant=\"filled\">Save</AxisButton>"
        }
      ],
      "accessibility": ["Keyboard accessible", "Focus visible"],
      "darkMode": true
    }
  ]
}
```

---

## Quality Checks

Before finalizing documentation updates:

- [ ] All components in `src/components/axis/` are documented in `docs/DESIGN_SYSTEM.md`
- [ ] All components are also documented in `public/design-kit.html`
- [ ] Component count in design-kit.html footer matches actual count
- [ ] "Last updated" date in design-kit.html is current
- [ ] All code examples are syntactically correct TypeScript
- [ ] All examples follow Axis Design System rules (semantic tokens, etc.)
- [ ] Props interfaces match actual component implementations
- [ ] Accessibility notes are included for interactive components
- [ ] Dark mode support is documented
- [ ] Alphabetical ordering is maintained
- [ ] Formatting matches existing documentation style
- [ ] HTML Design Kit works in both light and dark mode

---

## Example Invocation

**User:** "I just created a new AxisModal component"

**Agent Response:**
1. Read `src/components/axis/AxisModal.tsx`
2. Extract props: `variant`, `size`, `onClose`, `children`, etc.
3. Add new section to `docs/DESIGN_SYSTEM.md`:
   - Component description
   - Props interface
   - Usage examples (basic modal, with footer, custom sizes)
   - Accessibility notes (focus trap, ESC key, ARIA labels)
   - Dark mode notes
4. Update component catalog data structure
5. Confirm: "✅ Updated DESIGN_SYSTEM.md with AxisModal documentation"

---

## Future Enhancements

### In-Platform Documentation Page

When ready to build the in-platform docs page:

**File:** `src/app/design-system/page.tsx`

**Features:**
- Interactive component playground
- Live code examples with preview
- Toggle between light/dark mode
- Copy code snippets
- Search components
- Filter by category (Interactive, Layout, Feedback, etc.)

**Data Source:**
- Read from `docs/component-catalog.json`
- Or dynamically import component files
- Parse JSDoc comments for descriptions

**Layout:**
```
┌─────────────────────────────────────────┐
│ Design System                           │
├─────────┬───────────────────────────────┤
│ Search  │ Component Preview             │
│         │ [Interactive demo]            │
│ Filters │                               │
│ □ All   │ Props:                        │
│ □ Inter │ - variant: "filled"           │
│ □ Layout│ - size: "medium"              │
│ □ Feed  │                               │
│         │ Code:                         │
│ Compone │ <AxisButton variant="filled"> │
│ ─────── │   Click me                    │
│ Button  │ </AxisButton>                 │
│ Input   │                               │
│ Select  │ [Copy Code]                   │
└─────────┴───────────────────────────────┘
```

---

## Notes

- **Component naming:** All Axis components start with `Axis` prefix
- **Documentation location:** Always update `docs/DESIGN_SYSTEM.md` first
- **Version control:** Document when components were added (optional)
- **Breaking changes:** Note API changes in component descriptions
- **Component categories:** Interactive, Layout, Feedback, Data Display, Navigation

---

**Last Updated:** 2026-02-10
