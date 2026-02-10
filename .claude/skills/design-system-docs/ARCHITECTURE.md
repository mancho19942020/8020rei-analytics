# Design System Documentation Agent - Architecture

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    8020REI Analytics Dashboard                   │
└─────────────────────────────────────────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
         ┌──────────▼─────────┐    ┌─────────▼──────────┐
         │   Axis Components  │    │  Design System     │
         │   (Source Code)    │    │  Documentation     │
         └──────────┬─────────┘    └─────────▲──────────┘
                    │                         │
                    │              ┌──────────┴──────────┐
                    │              │  Documentation      │
                    └──────────────►  Agent              │
                                   │  (This System)      │
                                   └─────────────────────┘
```

---

## Data Flow

### 1. Component Creation Flow

```
Developer                Agent                    Documentation
    │                      │                           │
    │ 1. Create component  │                           │
    │─────────────────────►│                           │
    │                      │                           │
    │ 2. Ask to document   │                           │
    │─────────────────────►│                           │
    │                      │                           │
    │                      │ 3. Read component source  │
    │                      │──────────┐                │
    │                      │          │                │
    │                      │◄─────────┘                │
    │                      │                           │
    │                      │ 4. Extract props/variants │
    │                      │──────────┐                │
    │                      │          │                │
    │                      │◄─────────┘                │
    │                      │                           │
    │                      │ 5. Generate documentation │
    │                      │──────────┐                │
    │                      │          │                │
    │                      │◄─────────┘                │
    │                      │                           │
    │                      │ 6. Update DESIGN_SYSTEM.md│
    │                      │──────────────────────────►│
    │                      │                           │
    │ 7. Confirmation      │                           │
    │◄─────────────────────│                           │
    │                      │                           │
```

### 2. Documentation Check Flow

```
Developer                Check Script             Documentation
    │                        │                         │
    │ 1. Run check script    │                         │
    │───────────────────────►│                         │
    │                        │                         │
    │                        │ 2. Scan components      │
    │                        │─────────┐               │
    │                        │         │               │
    │                        │◄────────┘               │
    │                        │                         │
    │                        │ 3. Read docs            │
    │                        │────────────────────────►│
    │                        │                         │
    │                        │ 4. Compare lists        │
    │                        │─────────┐               │
    │                        │         │               │
    │                        │◄────────┘               │
    │                        │                         │
    │ 5. Report gaps         │                         │
    │◄───────────────────────│                         │
    │                        │                         │
```

---

## Component Architecture

### Agent Components

```
┌─────────────────────────────────────────────────────────────┐
│                   Documentation Agent                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐  │
│  │   Component    │  │  Documentation │  │   Template   │  │
│  │   Scanner      │  │   Generator    │  │   Engine     │  │
│  │                │  │                │  │              │  │
│  │ • Find files   │  │ • Read source  │  │ • Apply      │  │
│  │ • Parse names  │  │ • Extract data │  │   template   │  │
│  │ • Detect new   │  │ • Analyze types│  │ • Format     │  │
│  └────────┬───────┘  └────────┬───────┘  └──────┬───────┘  │
│           │                   │                   │          │
│           └───────────────────┴───────────────────┘          │
│                               │                              │
│                    ┌──────────▼──────────┐                   │
│                    │   Documentation     │                   │
│                    │   Writer            │                   │
│                    │                     │                   │
│                    │ • Update MD files   │                   │
│                    │ • Maintain format   │                   │
│                    │ • Generate catalog  │                   │
│                    └─────────────────────┘                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## File System Architecture

```
8020rei-analytics/
│
├── .claude/skills/design-system-docs/        ┐
│   ├── skill.md                              │
│   ├── README.md                             │  Agent Files
│   ├── AGENT_GUIDE.md                        │  (Instructions,
│   ├── QUICK_REFERENCE.md                    │   Scripts,
│   ├── ARCHITECTURE.md                       │   Templates)
│   ├── update-docs.sh                        │
│   └── templates/                            │
│       └── component.md                      ┘
│
├── docs/                                     ┐
│   ├── DESIGN_SYSTEM.md                      │  Documentation
│   ├── DESIGN_SYSTEM_AGENT_SUMMARY.md        │  (Output Files)
│   └── component-catalog.json (future)       ┘
│
└── src/                                      ┐
    ├── components/                            │
    │   ├── axis/                              │  Source Code
    │   │   ├── AxisButton.tsx                 │  (Input Files)
    │   │   ├── AxisInput.tsx                  │
    │   │   └── ... (12 components)            │
    │   └── dashboard/                         │
    │                                          │
    └── app/                                   │
        └── design-system/ (future)            │  Future: UI
            └── page.tsx                       ┘
```

---

## Process Flow Diagram

```
┌──────────────┐
│  Developer   │
│  Creates     │
│  Component   │
└──────┬───────┘
       │
       │ src/components/axis/AxisModal.tsx
       ▼
┌──────────────────────────────────────────┐
│  Component Scanner                       │
│  • Detects new .tsx file                 │
│  • Verifies naming convention (Axis*)    │
│  • Adds to components list               │
└──────┬───────────────────────────────────┘
       │
       │ Component metadata
       ▼
┌──────────────────────────────────────────┐
│  Source Code Parser                      │
│  • Reads TypeScript file                 │
│  • Extracts props interface              │
│  • Identifies variants/options           │
│  • Finds JSDoc comments                  │
└──────┬───────────────────────────────────┘
       │
       │ Structured component data
       ▼
┌──────────────────────────────────────────┐
│  Documentation Generator                 │
│  • Applies component template            │
│  • Generates usage examples              │
│  • Adds accessibility notes              │
│  • Includes dark mode info               │
└──────┬───────────────────────────────────┘
       │
       │ Formatted markdown
       ▼
┌──────────────────────────────────────────┐
│  Documentation Writer                    │
│  • Finds insertion point in MD           │
│  • Maintains alphabetical order          │
│  • Preserves existing formatting         │
│  • Writes to DESIGN_SYSTEM.md            │
└──────┬───────────────────────────────────┘
       │
       │ Updated documentation
       ▼
┌──────────────────────────────────────────┐
│  Component Catalog Generator (Future)    │
│  • Converts to JSON structure            │
│  • Writes component-catalog.json         │
│  • Prepares for UI consumption           │
└──────┬───────────────────────────────────┘
       │
       ▼
┌──────────────┐
│  Complete!   │
│  • MD updated│
│  • Ready for │
│    review    │
└──────────────┘
```

---

## Data Structures

### Component Metadata (Internal)

```typescript
interface ComponentMetadata {
  name: string                    // "AxisButton"
  filePath: string                // "src/components/axis/AxisButton.tsx"
  category: ComponentCategory     // "Interactive"
  props: ComponentProps[]         // Extracted from interface
  variants: Variant[]             // Different visual/behavioral modes
  examples: CodeExample[]         // Usage examples
  accessibility: string[]         // A11y features
  darkMode: string                // Dark mode behavior
  tokens: string[]                // Design tokens used
  relatedComponents: string[]     // Links to similar components
}

interface ComponentProps {
  name: string                    // "variant"
  type: string                    // "'filled' | 'outlined' | 'ghost'"
  required: boolean               // false
  defaultValue?: string           // "'filled'"
  description?: string            // "Visual style of the button"
}

interface Variant {
  name: string                    // "filled"
  description: string             // "Primary actions (Save, Submit)"
  usage: string                   // "Use for main call-to-action"
}

interface CodeExample {
  title: string                   // "Primary Button"
  code: string                    // "<AxisButton variant='filled'>Save</AxisButton>"
  description?: string            // "Standard primary action button"
}
```

### Component Catalog (Future JSON Output)

```json
{
  "version": "1.0.0",
  "lastUpdated": "2026-02-10",
  "components": [
    {
      "name": "AxisButton",
      "path": "src/components/axis/AxisButton.tsx",
      "category": "Interactive",
      "description": "Primary button component for user actions",
      "props": {
        "variant": {
          "type": "'filled' | 'outlined' | 'ghost'",
          "required": false,
          "default": "'filled'",
          "description": "Visual style variant"
        },
        "disabled": {
          "type": "boolean",
          "required": false,
          "default": "false",
          "description": "Disables interaction"
        }
      },
      "variants": [
        {
          "name": "filled",
          "description": "Primary actions",
          "preview": "bg-main-700 text-white"
        },
        {
          "name": "outlined",
          "description": "Secondary actions",
          "preview": "border-2 border-main-700 text-main-700"
        }
      ],
      "examples": [
        {
          "title": "Primary Button",
          "code": "<AxisButton variant=\"filled\">Save</AxisButton>",
          "preview": "..."
        }
      ],
      "accessibility": [
        "Keyboard accessible",
        "Focus visible",
        "ARIA compliant"
      ],
      "darkMode": true,
      "tokens": [
        "main-700",
        "neutral-900",
        "surface-raised"
      ]
    }
  ]
}
```

---

## Agent Workflow Steps

### Step 1: Detection
```bash
# Scan for components
find src/components/axis -name "Axis*.tsx" -type f

# Compare with documented list
grep "^### Axis" docs/DESIGN_SYSTEM.md
```

### Step 2: Analysis
```typescript
// Read component file
const componentSource = readFile('src/components/axis/AxisButton.tsx')

// Parse TypeScript
const ast = parseTypeScript(componentSource)

// Extract interface
const propsInterface = extractInterface(ast, 'AxisButtonProps')

// Identify variants
const variants = extractVariants(propsInterface)
```

### Step 3: Generation
```typescript
// Apply template
const documentation = applyTemplate('component.md', {
  name: 'AxisButton',
  purpose: extractPurpose(componentSource),
  category: 'Interactive',
  props: propsInterface,
  variants: variants,
  examples: generateExamples(propsInterface),
  accessibility: analyzeAccessibility(componentSource),
  darkMode: analyzeDarkMode(componentSource)
})
```

### Step 4: Integration
```typescript
// Find insertion point
const currentDocs = readFile('docs/DESIGN_SYSTEM.md')
const insertionPoint = findComponentsSection(currentDocs)

// Insert alphabetically
const updatedDocs = insertInAlphabeticalOrder(
  currentDocs,
  insertionPoint,
  documentation
)

// Write back
writeFile('docs/DESIGN_SYSTEM.md', updatedDocs)
```

---

## Integration Points

### Input Sources
1. **Component Files** - `src/components/axis/*.tsx`
   - TypeScript interfaces
   - Props definitions
   - JSDoc comments
   - Implementation details

2. **Design System** - `docs/DESIGN_SYSTEM.md`
   - Existing documentation
   - Formatting standards
   - Token definitions
   - Style guidelines

3. **Templates** - `.claude/skills/design-system-docs/templates/`
   - Component documentation template
   - Standard sections
   - Example formats

### Output Targets
1. **Main Documentation** - `docs/DESIGN_SYSTEM.md`
   - Human-readable markdown
   - Complete component reference
   - Usage guidelines

2. **Component Catalog** - `docs/component-catalog.json` (future)
   - Machine-readable JSON
   - Structured data
   - UI consumption ready

3. **In-Platform Docs** - `src/app/design-system/page.tsx` (future)
   - Interactive UI
   - Live previews
   - Code playground

---

## Scalability & Performance

### Current State
- **12 components** - Fast processing (< 1 second)
- **Single docs file** - Easy to maintain
- **Manual trigger** - On-demand updates

### Future Scale
- **50+ components** - Still fast (< 5 seconds)
- **Multiple docs files** - Category-based splitting
- **Auto-trigger** - Git hooks, CI/CD integration

### Performance Optimizations
1. **Caching** - Cache parsed component metadata
2. **Incremental updates** - Only process changed files
3. **Parallel processing** - Analyze multiple components simultaneously
4. **Smart diffing** - Detect actual changes, skip if identical

---

## Error Handling

### Component Detection Errors
- **File not found** - Skip gracefully, log warning
- **Invalid TypeScript** - Report syntax error, skip component
- **Missing props interface** - Use basic template, flag for review

### Documentation Generation Errors
- **Template parse error** - Fall back to minimal template
- **Example generation failed** - Use placeholder examples
- **Type extraction failed** - Document as `any`, flag for manual review

### File Write Errors
- **Docs file locked** - Retry with backoff
- **Permission denied** - Report error, suggest manual update
- **Disk full** - Abort gracefully, preserve existing docs

---

## Maintenance & Updates

### Agent Updates
When modifying the agent:
1. Update `skill.md` with new instructions
2. Update templates if format changes
3. Update examples in guides
4. Test with existing components
5. Document changes in changelog

### Documentation Format Changes
When changing doc format:
1. Update template: `templates/component.md`
2. Migrate existing docs to new format
3. Update examples in guides
4. Regenerate all component docs

### Adding New Features
1. Add to agent instructions (`skill.md`)
2. Update templates if needed
3. Add examples to guides
4. Test with sample component
5. Document in AGENT_GUIDE.md

---

## Future Architecture

### Phase 1: Enhanced Agent (Current)
```
[Component Files] → [Agent] → [DESIGN_SYSTEM.md]
```

### Phase 2: JSON Catalog
```
[Component Files] → [Agent] → [DESIGN_SYSTEM.md]
                            → [component-catalog.json]
```

### Phase 3: In-Platform Docs
```
[Component Files] → [Agent] → [DESIGN_SYSTEM.md]
                            → [component-catalog.json] → [/design-system UI]
```

### Phase 4: Full Integration
```
[Component Files] ─┬→ [Agent] ─┬→ [DESIGN_SYSTEM.md]
                   │           ├→ [component-catalog.json]
                   │           ├→ [/design-system UI]
                   │           └→ [Storybook integration]
                   │
                   └→ [Git Hooks] → [Auto-update on commit]
```

---

## Security & Permissions

### File Access
- **Read-only** - Component source files (never modified)
- **Write** - Documentation files only
- **No network** - All processing local
- **No execution** - Parses code, doesn't run it

### Safety Measures
- **Dry-run mode** - Preview changes before applying
- **Backup** - Create backup before major updates
- **Validation** - Verify markdown syntax before writing
- **Rollback** - Git-based rollback if issues occur

---

**This architecture ensures:**
- ✅ Scalable component documentation
- ✅ Consistent formatting across all docs
- ✅ Automated maintenance with minimal effort
- ✅ Future-ready for in-platform documentation
- ✅ Safe, reliable, and maintainable system

