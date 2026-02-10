# Component Documentation Template

Use this template when adding a new component to `docs/DESIGN_SYSTEM.md`.

---

## Template

```markdown
### ComponentName

**Purpose:** [One sentence describing what this component does and when to use it]

**Category:** [Interactive | Layout | Feedback | Data Display | Navigation]

**Variants:**
- `variant1` - Description of when to use this variant
- `variant2` - Description of when to use this variant

**Props:**
```tsx
interface ComponentNameProps {
  // Required props
  children: React.ReactNode

  // Optional props
  variant?: 'variant1' | 'variant2' | 'variant3'
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
  className?: string

  // Event handlers
  onClick?: () => void
  onChange?: (value: string) => void
}
```

**Basic Usage:**
```tsx
// Minimal example
<ComponentName>
  Content here
</ComponentName>

// With variant
<ComponentName variant="variant1">
  Content here
</ComponentName>

// With size
<ComponentName size="large">
  Content here
</ComponentName>
```

**Advanced Usage:**
```tsx
// Full featured example
<ComponentName
  variant="variant2"
  size="medium"
  disabled={isLoading}
  className="custom-class"
  onClick={handleClick}
>
  Advanced content
</ComponentName>

// Complex real-world example
<ComponentName variant="variant3">
  <div className="flex items-center gap-2">
    <Icon name="check" />
    <span>With icon</span>
  </div>
</ComponentName>
```

**States:**
- **Default** - Normal interactive state
- **Hover** - Visual feedback on pointer over
- **Focus** - Keyboard focus indicator
- **Active** - Pressed/clicked state
- **Disabled** - Non-interactive state
- **Loading** - (If applicable) Async operation in progress

**Accessibility:**
- ✅ Keyboard accessible via Tab/Enter/Space
- ✅ Focus visible with ring indicator
- ✅ ARIA label support via `aria-label` prop
- ✅ ARIA attributes: `role="button"`, `aria-disabled="true"`
- ✅ Screen reader friendly with semantic HTML
- ✅ Respects `prefers-reduced-motion`

**Dark Mode:**
- Automatically adapts using semantic tokens
- Uses `bg-surface-raised` for backgrounds
- Uses `text-content-primary` for text
- [Any component-specific dark mode notes]

**Design Tokens Used:**
- `main-700` - Primary actions
- `neutral-200` - Borders (light mode)
- `neutral-700` - Borders (dark mode)
- `surface-raised` - Background

**Common Patterns:**
```tsx
// Pattern 1: With icon
<ComponentName>
  <Icon name="plus" />
  Add Item
</ComponentName>

// Pattern 2: With state
const [isOpen, setIsOpen] = useState(false)
<ComponentName onClick={() => setIsOpen(!isOpen)}>
  {isOpen ? 'Close' : 'Open'}
</ComponentName>

// Pattern 3: In form
<form onSubmit={handleSubmit}>
  <AxisInput label="Name" />
  <ComponentName type="submit">
    Submit
  </ComponentName>
</form>
```

**Do's and Don'ts:**

✅ **Do:**
- Use semantic variant names
- Test in both light and dark mode
- Provide accessible labels
- Follow spacing conventions

❌ **Don't:**
- Use raw HTML elements instead of this component
- Override core styles with `!important`
- Forget dark mode variants
- Skip accessibility attributes

**Related Components:**
- [`RelatedComponent1`](#relatedcomponent1) - When to use this instead
- [`RelatedComponent2`](#relatedcomponent2) - Often used together

**Implementation Notes:**
- File location: `src/components/axis/ComponentName.tsx`
- Uses Axis Design System tokens
- Fully typed with TypeScript
- Tested in Storybook (if applicable)

---

**Added:** [Date component was added to the system]
**Last Updated:** [Date of last significant change]
```

---

## Example: AxisButton

Here's how the actual AxisButton is documented:

```markdown
### AxisButton

**Purpose:** Primary button component for user actions and navigation.

**Category:** Interactive

**Variants:**
- `filled` - Primary actions (Save, Submit, Confirm)
- `outlined` - Secondary actions (Cancel, Back)
- `ghost` - Tertiary actions (Learn More, Skip)

**Props:**
```tsx
interface AxisButtonProps {
  children: React.ReactNode
  variant?: 'filled' | 'outlined' | 'ghost'
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  onClick?: () => void
  className?: string
}
```

**Basic Usage:**
```tsx
// Primary action
<AxisButton variant="filled">Save</AxisButton>

// Secondary action
<AxisButton variant="outlined">Cancel</AxisButton>

// Tertiary action
<AxisButton variant="ghost">Learn More</AxisButton>
```

**Advanced Usage:**
```tsx
// Submit button in form
<form onSubmit={handleSubmit}>
  <AxisInput label="Email" />
  <AxisButton type="submit" variant="filled">
    Submit
  </AxisButton>
</form>

// Disabled state
<AxisButton variant="filled" disabled={isLoading}>
  {isLoading ? 'Saving...' : 'Save'}
</AxisButton>

// Small size for compact spaces
<AxisButton variant="outlined" size="small">
  Edit
</AxisButton>
```

**States:**
- **Default** - Normal clickable state
- **Hover** - Darker background on pointer over
- **Focus** - Visible focus ring for keyboard navigation
- **Active** - Pressed appearance
- **Disabled** - Reduced opacity, not clickable

**Accessibility:**
- ✅ Keyboard accessible via Tab and Enter/Space
- ✅ Focus visible with `ring-2 ring-main-500`
- ✅ Disabled state uses `aria-disabled="true"`
- ✅ Button type defaults to `button` (prevents form submission)
- ✅ Proper contrast ratios in all variants

**Dark Mode:**
- Filled variant: Uses `main-700` → `main-600` on hover
- Outlined variant: Border adapts with `border-stroke`
- Ghost variant: Transparent with `hover:bg-surface-raised`

**Design Tokens Used:**
- `main-700` - Filled variant background
- `main-900` - Filled variant hover state
- `border-stroke` - Outlined variant border
- `text-content-primary` - Ghost variant text

**Common Patterns:**
```tsx
// Action buttons in modal footer
<div className="flex gap-3 justify-end">
  <AxisButton variant="ghost" onClick={onClose}>
    Cancel
  </AxisButton>
  <AxisButton variant="filled" onClick={onSave}>
    Save Changes
  </AxisButton>
</div>

// Icon with text
<AxisButton variant="filled">
  <Icon name="plus" />
  Add New
</AxisButton>
```

**Do's and Don'ts:**

✅ **Do:**
- Use `filled` for primary actions (one per section)
- Use `outlined` for secondary actions
- Use `ghost` for tertiary or less important actions
- Test keyboard navigation

❌ **Don't:**
- Use multiple `filled` buttons in the same context
- Use `<button>` HTML element instead
- Forget to set `type="button"` if not in a form
- Use raw Tailwind classes for styling

**Related Components:**
- [`AxisNavigationTab`](#axisnavigationtab) - For tab-based navigation
- [`AxisCheckbox`](#axischeckbox) - For toggle actions

**Implementation Notes:**
- File: `src/components/axis/AxisButton.tsx`
- Uses Tailwind CSS classes with Axis tokens
- Supports all standard button HTML attributes
- Focus ring uses `focus-visible:` for keyboard-only indication

**Added:** January 22, 2026
```

---

## Filling Out the Template

### 1. Component Name
Use the exact component name (e.g., `AxisButton`, `AxisModal`)

### 2. Purpose
One clear sentence. Examples:
- "Primary button component for user actions and navigation"
- "Modal dialog for displaying focused content and capturing user input"
- "Text input field with label, validation, and error states"

### 3. Category
Choose one:
- **Interactive** - Buttons, inputs, toggles, checkboxes
- **Layout** - Cards, grids, containers, dividers
- **Feedback** - Callouts, toasts, loading states, skeletons
- **Data Display** - Tables, pills, tags, charts
- **Navigation** - Tabs, breadcrumbs, menus

### 4. Variants
List all visual/behavioral variants:
- Describe when to use each
- Include design tokens used
- Show visual differences

### 5. Props
Copy the TypeScript interface directly from the component file.
Add inline comments explaining complex props.

### 6. Usage Examples
Include:
- **Basic** - Minimal working example
- **Advanced** - With multiple props
- **Real-world** - Actual use case from the app

### 7. States
List all interactive states:
- Default, Hover, Focus, Active
- Disabled, Loading (if applicable)
- Error, Success (for forms)

### 8. Accessibility
Check for:
- Keyboard navigation support
- Focus indicators
- ARIA attributes
- Screen reader compatibility
- Motion preferences

### 9. Dark Mode
Document:
- Which tokens adapt automatically
- Any manual dark: variants
- Testing checklist

### 10. Common Patterns
Show frequent usage scenarios from the actual codebase.

---

## Checklist Before Adding

- [ ] Component name is correct
- [ ] Purpose is one clear sentence
- [ ] All variants are listed
- [ ] Props interface matches source code
- [ ] Examples are valid TypeScript
- [ ] Examples follow design system rules
- [ ] Accessibility notes are complete
- [ ] Dark mode behavior is documented
- [ ] Related components are linked
- [ ] File location is correct
- [ ] Formatting matches existing docs

---

**Use this template for every new component to maintain consistency!**
