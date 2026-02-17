# Axis Design System - 8020REI Analytics

**Complete design specification for the 8020REI Analytics Dashboard.**

This project uses the **Axis Design System** - a production-grade, multi-brand design token system built for scalability and accessibility.

---

## Table of Contents

1. [Philosophy](#philosophy)
2. [Color Tokens](#color-tokens)
3. [Typography](#typography)
4. [Spacing](#spacing)
5. [Components](#components)
6. [Dark Mode](#dark-mode)
7. [Accessibility](#accessibility)

---

## Philosophy

### Core Principles

1. **Semantic Tokens** - Use `main`, `success`, `error` instead of color names
2. **Dark Mode First** - Every component supports both light and dark themes
3. **Accessible** - WCAG AA compliant with 4.5:1 text contrast
4. **Consistent** - Unified spacing, typography, and interaction patterns

### Design Rules (Non-Negotiable)

- **NEVER** use raw color names: `bg-blue-500`, `text-green-700`, `border-red-300`
- **ALWAYS** use semantic tokens: `bg-main-500`, `text-success-700`, `border-error-300`
- **ALWAYS** test in both light and dark modes
- **ALWAYS** verify WCAG AA contrast ratios

---

## Color Tokens

### Token Naming Convention

All colors use **semantic names** (not color names) for scalability:

```
main-{shade}           Primary brand color (BLUE for this project)
accent-{1-5}-{shade}   Five accent palettes for charts/variety
neutral-{shade}        Gray scale for text, backgrounds, borders
success|alert|error|info-{shade}   Semantic status colors
```

### Main Brand Color (BLUE)

The `main` color is the primary brand color for this analytics dashboard.

**Usage in Code:**
```tsx
className="bg-main-700 text-white"           // Primary button
className="text-main-700"                    // Links, emphasis
className="border-main-500"                  // Focus rings
className="bg-main-50 text-main-900"         // Badges, highlights
```

**Shade Guide:**
- `main-50` / `main-100` - Light backgrounds, subtle highlights
- `main-300` - Borders, disabled states
- `main-500` - Icons, secondary elements
- `main-700` - **Primary buttons, links, key actions** ⭐
- `main-900` / `main-950` - Hover states, dark backgrounds

### Accent Colors

Five accent palettes for charts, data visualization, and UI variety:

- **Accent 1** - Blue tones (charts, data viz)
- **Accent 2** - Indigo/Purple tones
- **Accent 3** - Orange tones
- **Accent 4** - Lime tones
- **Accent 5** - Pink/Magenta tones

**Usage:**
```tsx
className="bg-accent-1-500"   // Chart bar
className="text-accent-3-700" // Highlighted metric
```

### Neutral Scale

Gray scale used for text, backgrounds, borders, and disabled states.

**Common Uses:**
- `neutral-900` - Primary text (light mode)
- `neutral-700` - Secondary text (light mode)
- `neutral-500` - Tertiary text, metadata
- `neutral-200` - Borders (light mode)
- `neutral-100` - Raised surfaces (light mode)
- `neutral-50` - Light backgrounds

### Semantic Status Colors

| Token | Purpose | Example Use |
|-------|---------|-------------|
| `success` | Positive feedback, confirmations | "Saved successfully" message |
| `alert` | Warnings, cautions | "Review required" notice |
| `error` | Errors, destructive actions | Form validation errors |
| `info` | Informational, neutral feedback | Helpful tips, FYI messages |

Each has shades: 50, 100, 300, 500, 700, 900, 950

---

## Typography

### Font Family

**Inter** is the only font. Available weights: 400 (Regular), 500 (Medium), 600 (SemiBold).

```css
font-family: 'Inter', system-ui, sans-serif;
```

### Type Scale

**Headlines** (use semantic classes):
- `text-h1` - 22px, weight 600, line-height 1.3 - Page titles
- `text-h2` - 20px, weight 600, line-height 1.3 - Section titles
- `text-h3` - 18px, weight 600, line-height 1.35 - Subsections
- `text-h4` - 16px, weight 600, line-height 1.4 - Component titles
- `text-h5` - 14px, weight 600, line-height 1.4 - Small headers

**Body Text:**
- `text-body-large` - 16px, weight 400, line-height 1.5 - Lead text
- `text-body-regular` - 14px, weight 400, line-height 1.5 - **Default body** ⭐

**Labels & Small Text:**
- `text-label` - 12px, weight 400, line-height 1.4 - Form labels, metadata
- `text-label-bold` - 12px, weight 500 - Emphasized labels
- `text-suggestion` - 10px, weight 400 - Badges, tags, timestamps only

**Buttons:**
- `text-button-regular` - 14px, weight 500, line-height 1.4 - Standard buttons
- `text-button-small` - 12px, weight 500 - Compact buttons

### Typography Rules

**Mandatory:**
- Minimum 14px for body text
- 10px text only for non-essential info (badges, timestamps)
- Line height 1.5 for body text (readability)

**Prohibited:**
- Raw Tailwind sizes: `text-xs`, `text-sm`, `text-base`, `text-lg`
- Arbitrary values: `text-[16px]`, `text-[1.5rem]`

---

## Shadows and Elevation

### Shadow Design Principles

Shadows in this design system follow a "subtle by default, prominent on interaction" principle:

1. **Default state:** Minimal shadows (`shadow-xs`) for a clean, flat appearance
2. **Hover state:** Slightly stronger shadows (`shadow-sm`) to indicate interactivity
3. **Edit mode:** More pronounced shadows (`shadow-md`) to indicate draggable elements

### Shadow Scale Usage

| State | Shadow Class | Usage |
|-------|-------------|-------|
| Default | `shadow-xs` | Widgets, cards at rest |
| Hover (normal) | `hover:shadow-sm` | Interactive cards on hover |
| Hover (edit mode) | `hover:shadow-md` | Draggable widgets in edit mode |
| Elevated | `shadow-md` | Dropdowns, popovers |
| Overlay | `shadow-lg` | Modals, dialogs |

### Widget Shadow Pattern

```tsx
// Widget component shadow pattern
className={[
  'shadow-xs transition-all duration-200',
  editMode
    ? 'hover:shadow-md hover:border-main-500 cursor-grab'  // Edit mode: stronger hover
    : 'hover:shadow-sm',  // Normal mode: subtle hover
].join(' ')}
```

### MetricCard Shadow Pattern

```tsx
// MetricCard hover shadow (reduced intensity)
className="hover:shadow-sm transition-all duration-200"
```

---

## Spacing

### Base Unit: 4px

All spacing is based on a 4px unit.

### Common Patterns

| Pattern | Classes | Pixels | Usage |
|---------|---------|--------|-------|
| Section Padding | `px-6 py-4` | 24px × 16px | **Standard for all sections** ⭐ |
| Card Padding | `p-4` | 16px | Internal card padding |
| Button Padding | `px-4 py-2` | 16px × 8px | Standard buttons |
| Input Padding | `px-3 py-2` | 12px × 8px | Form inputs |
| Badge Padding | `px-2 py-0.5` | 8px × 2px | Small badges/tags |

### Gap Scale (Flex/Grid)

- `gap-2` - 8px - Tight inline items
- `gap-3` - 12px - Default list spacing
- `gap-4` - 16px - **Standard grid gap** ⭐
- `gap-6` - 24px - Card grids
- `gap-8` - 32px - Section separations

---

## Components

### Overview

All UI elements **MUST** use Axis components. **Never use raw HTML elements.**

**Available Components (12 total):**
- `AxisButton` - Interactive buttons for actions and navigation
- `AxisInput` - Text inputs with validation and icons
- `AxisSelect` - Dropdown selections with searchable options
- `AxisCard` - Content containers and stat cards
- `AxisCallout` - Contextual feedback and alerts
- `AxisTable` - Full-featured data tables
- `AxisPill` - Non-interactive metric displays
- `AxisTag` - Categorization and status labels
- `AxisNavigationTab` - Tab navigation
- `AxisCheckbox` - Checkbox inputs with indeterminate state
- `AxisSkeleton` - Loading placeholders
- `AxisToggle` - Toggle/switch controls

---

### AxisButton

**Purpose:** Versatile button component for user actions and navigation.

**Category:** Interactive

**File:** `src/components/axis/AxisButton.tsx`

**Variants:**
- `filled` (default) - Solid background with white text for primary actions
- `outlined` - Border only with transparent background for secondary actions
- `ghost` - No border or background for tertiary actions

**Sizes:**
- `sm` - 28px height, 12px text - compact spaces
- `md` (default) - 36px height, 14px text - standard use
- `lg` - 44px height, 16px text - prominent CTAs

**Props:**
```tsx
interface AxisButtonProps {
  variant?: 'filled' | 'outlined' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  destructive?: boolean
  disabled?: boolean
  loading?: boolean
  iconLeft?: ReactNode
  iconRight?: ReactNode
  iconOnly?: boolean
  type?: 'button' | 'submit' | 'reset'
  fullWidth?: boolean
  children?: ReactNode
}
```

**Basic Usage:**
```tsx
// Primary action
<AxisButton variant="filled">Save Changes</AxisButton>

// Secondary action
<AxisButton variant="outlined">Cancel</AxisButton>

// Tertiary action
<AxisButton variant="ghost">Learn More</AxisButton>

// With icon
<AxisButton variant="filled" iconLeft={<PlusIcon />}>
  Add Item
</AxisButton>

// Loading state
<AxisButton loading>Processing...</AxisButton>

// Destructive action
<AxisButton variant="filled" destructive>
  Delete Account
</AxisButton>
```

**States:**
- Default - Normal clickable state
- Hover - Darker background on pointer over
- Focus - Visible focus ring for keyboard navigation
- Active - Pressed appearance
- Disabled - Reduced opacity, not clickable
- Loading - Spinner animation, not clickable

**Accessibility:**
- ✅ Keyboard accessible via Tab and Enter/Space
- ✅ Focus visible with `ring-2 ring-main-500`
- ✅ Loading state uses `aria-disabled` and `aria-busy`
- ✅ Button type defaults to `button` to prevent form submission
- ✅ Icons are `aria-hidden`

**Dark Mode:**
- Filled variant: `bg-main-700` → `bg-main-900` on hover
- Outlined variant: Border and text adapt with semantic tokens
- Ghost variant: Transparent with `hover:bg-main-50 dark:hover:bg-main-950`

**Common Patterns:**
```tsx
// Action buttons in modal footer
<div className="flex gap-3 justify-end">
  <AxisButton variant="ghost" onClick={onClose}>Cancel</AxisButton>
  <AxisButton variant="filled" onClick={onSave}>Save Changes</AxisButton>
</div>

// Form submit button
<form onSubmit={handleSubmit}>
  <AxisInput label="Email" />
  <AxisButton type="submit" variant="filled" fullWidth>
    Sign In
  </AxisButton>
</form>

// Icon-only button
<AxisButton variant="ghost" iconOnly iconLeft={<MenuIcon />} />
```

---

### AxisInput

**Purpose:** Text input component with label, validation, and icon support.

**Category:** Interactive

**File:** `src/components/axis/AxisInput.tsx`

**Types:**
- `text` (default) - Standard text input
- `email` - Email input with validation
- `password` - Password with toggle visibility
- `tel` - Phone number input
- `url` - URL/website input
- `number` - Numeric input
- `search` - Search input with clear button

**Sizes:**
- `sm` - 28px height - compact spaces
- `md` (default) - 36px height - standard use
- `lg` - 44px height - prominent inputs

**Props:**
```tsx
interface AxisInputProps {
  size?: 'sm' | 'md' | 'lg'
  type?: 'text' | 'email' | 'password' | 'tel' | 'url' | 'number' | 'search'
  label?: string
  helperText?: string
  error?: string
  iconLeft?: ReactNode
  iconRight?: ReactNode
  fullWidth?: boolean
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
}
```

**Basic Usage:**
```tsx
// Standard input
<AxisInput
  label="Email"
  type="email"
  placeholder="you@example.com"
/>

// With validation error
<AxisInput
  label="Password"
  type="password"
  error="Password must be at least 8 characters"
/>

// With helper text
<AxisInput
  label="Username"
  helperText="Must be unique across the platform"
/>

// With icon
<AxisInput
  label="Search"
  type="search"
  iconLeft={<SearchIcon />}
/>
```

**States:**
- Default - Ready for input
- Filled - Contains value
- Focus - Border highlight and ring
- Hover - Border darkens
- Disabled - Gray background, not editable
- ReadOnly - Not editable but focusable
- Error - Red border and error message

**Accessibility:**
- ✅ Uses semantic `<input>` with proper labeling
- ✅ Error messages linked via `aria-describedby`
- ✅ Required fields use `aria-required`
- ✅ Icons are `aria-hidden`
- ✅ Password toggle has proper `aria-label`

**Dark Mode:**
- Background: `bg-surface-base`
- Border: `border-stroke` adapts automatically
- Error state: Uses error tokens that adapt

**Common Patterns:**
```tsx
// Form group
<form>
  <AxisInput label="First Name" required />
  <AxisInput label="Last Name" required />
  <AxisInput label="Email" type="email" required />
  <AxisButton type="submit">Submit</AxisButton>
</form>

// Search input
<AxisInput
  type="search"
  placeholder="Search..."
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
/>
```

---

### AxisSelect

**Purpose:** Dropdown selection component for choosing from a list of options.

**Category:** Interactive

**File:** `src/components/axis/AxisSelect.tsx`

**Sizes:**
- `sm` - 28px height - compact spaces
- `md` (default) - 36px height - standard use
- `lg` - 44px height - prominent selects

**Props:**
```tsx
interface AxisSelectOption {
  value: string | number
  label: string
  disabled?: boolean
}

interface AxisSelectProps {
  options: AxisSelectOption[]
  value?: string | number
  onChange?: (value: string) => void
  size?: 'sm' | 'md' | 'lg'
  label?: string
  helperText?: string
  error?: string
  iconLeft?: ReactNode
  fullWidth?: boolean
  placeholder?: string
  required?: boolean
  disabled?: boolean
}
```

**Basic Usage:**
```tsx
// Basic select
<AxisSelect
  label="Country"
  options={countryOptions}
  value={country}
  onChange={setCountry}
/>

// With placeholder
<AxisSelect
  label="Category"
  options={categories}
  placeholder="Select a category..."
  value={category}
  onChange={setCategory}
/>

// With error
<AxisSelect
  label="Plan"
  options={plans}
  value={plan}
  onChange={setPlan}
  error="Please select a plan"
/>
```

**States:**
- Default - Ready for selection
- Focus - Border highlight and ring
- Hover - Border darkens
- Disabled - Gray background, not clickable
- Error - Red border and error message

**Accessibility:**
- ✅ Uses semantic `<select>` element
- ✅ Keyboard navigation works natively
- ✅ Error messages linked via `aria-describedby`
- ✅ Required fields indicated

**Dark Mode:**
- Background and border adapt via semantic tokens
- Chevron icon matches theme

---

### AxisCard

**Purpose:** Unified card component for content containers with multiple variants.

**Category:** Layout

**File:** `src/components/axis/AxisCard.tsx`

**Variants:**
- `default` - General content container with border
- `outlined` - Card with emphasized border (2px)
- `elevated` - Card with shadow elevation

**Padding Options:**
- `none` - No padding
- `sm` - 12px padding
- `md` (default) - 16px padding
- `lg` - 24px padding

**Props:**
```tsx
interface AxisCardProps {
  variant?: 'default' | 'outlined' | 'elevated'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  rounded?: 'none' | 'sm' | 'md' | 'lg'
  interactive?: boolean
  clickable?: boolean
  disabled?: boolean
  children: ReactNode
}

interface AxisCardStatProps {
  label: string
  value: string | number
  icon?: ReactNode
  color?: 'neutral' | 'main' | 'success' | 'error' | 'accent-1' | 'accent-2' | 'accent-3'
  empty?: boolean
  children?: ReactNode
}
```

**Basic Usage:**
```tsx
// Basic card
<AxisCard>
  <h3>Card Title</h3>
  <p>Card content goes here</p>
</AxisCard>

// Stat card
<AxisCard.Stat
  label="Total Revenue"
  value="$123,456"
  icon={<ChartIcon />}
  color="success"
/>

// Interactive card
<AxisCard clickable onClick={handleClick}>
  <h3>Click me</h3>
</AxisCard>

// With sub-components
<AxisCard padding="none">
  <AxisCard.Header title="Dashboard" subtitle="Overview" />
  <AxisCard.Body>Content here</AxisCard.Body>
  <AxisCard.Footer>Footer actions</AxisCard.Footer>
</AxisCard>
```

**Sub-Components:**
- `AxisCard.Header` - Card header with title, subtitle, and action
- `AxisCard.Body` - Card main content area
- `AxisCard.Footer` - Card footer with border
- `AxisCard.Media` - Media content (images, etc.)
- `AxisCard.Stat` - Stat variant for displaying metrics

**Accessibility:**
- ✅ Interactive cards use `role="button"` and `tabIndex={0}`
- ✅ Focus ring visible for keyboard users
- ✅ Proper ARIA attributes

**Dark Mode:**
- Background: `bg-surface-base`
- Border: `border-stroke`
- All adapt automatically

---

### AxisCallout

**Purpose:** Contextual feedback component for displaying messages and alerts. Features a prominent accent bar on the left side for visual type identification.

**Category:** Feedback

**File:** `src/components/axis/AxisCallout.tsx`

**Types:**
- `info` (default) - Informational messages (uses `accent-1-*` blue colors for better light mode contrast)
- `success` - Success confirmations (green accent)
- `alert` - Warnings and cautions (yellow accent)
- `error` - Errors and critical issues (red accent)

**Visual Features:**
- **Accent bar** - 8px wide colored bar on the left side for quick visual type identification
- **Rounded corners** - Consistent with other Axis components
- **Semantic colors** - Each type uses defined color token shades (50, 100, 300, 500, 700, 900, 950)

**Props:**
```tsx
interface AxisCalloutProps {
  type?: 'info' | 'success' | 'alert' | 'error'
  title?: string
  icon?: ReactNode
  hideIcon?: boolean  // NEW: Optionally hide the type icon
  dismissible?: boolean
  onDismiss?: () => void
  children: ReactNode
}
```

**Basic Usage:**
```tsx
// Info callout
<AxisCallout type="info">
  This is an informational message.
</AxisCallout>

// Success with title
<AxisCallout type="success" title="Success!">
  Your changes have been saved successfully.
</AxisCallout>

// Error with dismiss
<AxisCallout
  type="error"
  title="Error"
  dismissible
  onDismiss={handleDismiss}
>
  Unable to connect to the server. Please try again.
</AxisCallout>

// Alert/warning
<AxisCallout type="alert" title="Warning">
  This action cannot be undone.
</AxisCallout>

// Hide the icon for compact display
<AxisCallout type="info" hideIcon>
  Compact informational message without icon.
</AxisCallout>
```

**Color Token Usage:**
| Type | Background | Accent Bar | Text | Icon |
|------|------------|------------|------|------|
| info | `accent-1-50/950` | `accent-1-500` | `accent-1-700/300` | `accent-1-700/300` |
| success | `success-50/950` | `success-500` | `success-700/300` | `success-700/300` |
| alert | `alert-50/950` | `alert-500` | `alert-700/300` | `alert-700/300` |
| error | `error-50/950` | `error-500` | `error-700/300` | `error-700/300` |

**Note:** The `info` type uses `accent-1-*` (blue) tokens instead of `info-*` (cyan) for better contrast and visual consistency in light mode.

**Accessibility:**
- ✅ Uses `role="alert"` for error/alert types
- ✅ Uses `role="status"` for info/success types
- ✅ Icons are `aria-hidden`
- ✅ Dismiss button has `aria-label`

**Dark Mode:**
- Each type has specific dark mode colors
- Background, border, text, and icons all adapt
- Accent bar color remains consistent across themes

---

### AxisTable

**Purpose:** Production-ready data table with sorting, pagination, and selection.

**Category:** Data Display

**File:** `src/components/axis/AxisTable.tsx`

**Features:**
- Sortable columns (click header to sort)
- Row selection with checkboxes
- Pagination with rows-per-page selector
- Auto-formatting (currency, percentage, number, date, boolean)
- Loading, empty, and error states
- Fixed header with scrollable body

**Props:**
```tsx
interface Column {
  field: string
  header: string
  type?: 'text' | 'number' | 'currency' | 'percentage' | 'date' | 'boolean'
  sortable?: boolean
  hidden?: boolean
  width?: string
  minWidth?: string
  maxWidth?: string
  align?: 'left' | 'center'
}

interface AxisTableProps {
  columns: Column[]
  data: RowData[]
  rowKey?: string
  title?: string
  rowLabel?: string
  sortable?: boolean
  selectable?: boolean
  paginated?: boolean
  loading?: boolean
  error?: string | null
  emptyMessage?: string
  defaultPageSize?: number
  onSelectionChange?: (selectedRows: RowData[]) => void
  onSortChange?: (sort: SortModel | null) => void
  onRowClick?: (row: RowData) => void
}
```

**Basic Usage:**
```tsx
// Define columns
const columns: Column[] = [
  { field: 'name', header: 'Name', sortable: true },
  { field: 'email', header: 'Email' },
  { field: 'revenue', header: 'Revenue', type: 'currency', sortable: true },
  { field: 'growth', header: 'Growth', type: 'percentage' },
  { field: 'active', header: 'Active', type: 'boolean' },
]

// Render table
<AxisTable
  columns={columns}
  data={tableData}
  sortable
  selectable
  paginated
  onRowClick={handleRowClick}
  onSelectionChange={handleSelection}
/>

// With loading state
<AxisTable
  columns={columns}
  data={[]}
  loading={isLoading}
/>

// With error state
<AxisTable
  columns={columns}
  data={[]}
  error="Failed to load data"
/>
```

**Accessibility:**
- ✅ Sortable headers are keyboard accessible
- ✅ Row selection checkboxes have `aria-label`
- ✅ Pagination controls are keyboard accessible
- ✅ Loading state announced to screen readers

**Dark Mode:**
- Header: `bg-surface-raised`
- Rows: `bg-surface-base` with hover state
- Selected rows: `bg-main-50 dark:bg-main-950/30`

---

### AxisPill

**Purpose:** Non-interactive metric display for insights bars and dashboards.

**Category:** Data Display

**File:** `src/components/axis/AxisPill.tsx`

**Types:**
- `default` - Neutral styling for general metrics
- `good` - Green value for positive metrics
- `bad` - Red value for negative metrics

**Props:**
```tsx
interface AxisPillProps {
  label: string
  value: string | number
  type?: 'default' | 'good' | 'bad'
  className?: string
}
```

**Basic Usage:**
```tsx
// Neutral metric
<AxisPill label="Properties" value="45K" />

// Positive metric
<AxisPill label="Revenue" value="$99.9K" type="good" />

// Negative metric
<AxisPill label="Churn" value="12%" type="bad" />

// In a row
<div className="flex gap-2">
  <AxisPill label="Users" value="1,234" />
  <AxisPill label="Growth" value="+15%" type="good" />
  <AxisPill label="Churn" value="-3%" type="bad" />
</div>
```

**Design Notes:**
- Non-interactive by design (display-only)
- Uses `bg-surface-raised` for visual distinction
- Label and value are clearly separated

**Dark Mode:**
- Background: `bg-surface-raised`
- Good: `text-success-700 dark:text-success-400`
- Bad: `text-error-700 dark:text-error-400`

---

### AxisTag

**Purpose:** Small label for categorizing or highlighting content.

**Category:** Data Display

**File:** `src/components/axis/AxisTag.tsx`

**Colors:**
- `neutral` (default) - Gray for general labels
- `success` - Green for positive status
- `alert` - Yellow/amber for warnings
- `error` - Red for errors
- `info` - Blue for informational

**Variants:**
- `filled` (default) - Solid background
- `outlined` - Border only, transparent background

**Sizes:**
- `sm` - 24px height - compact spaces
- `md` (default) - 28px height - standard use

**Props:**
```tsx
interface AxisTagProps {
  color?: 'neutral' | 'success' | 'alert' | 'error' | 'info'
  size?: 'sm' | 'md'
  variant?: 'filled' | 'outlined'
  dot?: boolean
  iconLeft?: ReactNode
  dismissible?: boolean
  disabled?: boolean
  children?: ReactNode
  onDismiss?: () => void
  className?: string
}
```

**Basic Usage:**
```tsx
// Basic tag
<AxisTag>Label</AxisTag>

// Colored tags
<AxisTag color="success">Active</AxisTag>
<AxisTag color="error">Failed</AxisTag>
<AxisTag color="alert">Pending</AxisTag>

// With status dot
<AxisTag color="success" dot>Online</AxisTag>

// Dismissible tag
<AxisTag dismissible onDismiss={handleDismiss}>
  Filter: Active
</AxisTag>

// Outlined variant
<AxisTag variant="outlined" color="info">
  New Feature
</AxisTag>

// With icon
<AxisTag iconLeft={<UserIcon />}>Admin</AxisTag>
```

**Accessibility:**
- ✅ Dismiss button has `aria-label="Remove tag"`
- ✅ Icons are `aria-hidden`
- ✅ Disabled state uses proper cursor

**Dark Mode:**
- All color variants adapt with dark mode tokens
- Filled and outlined variants both support dark mode

---

### AxisNavigationTab

**Purpose:** Tab navigation for switching between views within the same screen.

**Category:** Navigation

**File:** `src/components/axis/AxisNavigationTab.tsx`

**Variants:**
- `line` (default) - Underline indicator for selected tab
- `contained` - Pill/badge style background for selected tab

**Sizes:**
- `sm` - 36px height - compact spaces
- `md` (default) - 52px height - standard use

**Props:**
```tsx
interface AxisNavigationTabItem {
  id: string
  name: string
  icon?: ReactNode
  disabled?: boolean
  badge?: number | string
  href?: string
}

interface AxisNavigationTabProps {
  activeTab: string
  onTabChange: (tabId: string) => void
  tabs: AxisNavigationTabItem[]
  variant?: 'line' | 'contained'
  size?: 'sm' | 'md'
  ariaLabel?: string
  fullWidth?: boolean
}
```

**Basic Usage:**
```tsx
// Define tabs
const tabs = [
  { id: 'overview', name: 'Overview' },
  { id: 'analytics', name: 'Analytics', badge: 3 },
  { id: 'settings', name: 'Settings' },
]

// Line variant (default)
<AxisNavigationTab
  activeTab={activeTab}
  onTabChange={setActiveTab}
  tabs={tabs}
/>

// Contained variant
<AxisNavigationTab
  activeTab={activeTab}
  onTabChange={setActiveTab}
  tabs={tabs}
  variant="contained"
/>

// With icons
const tabsWithIcons = [
  { id: 'home', name: 'Home', icon: <HomeIcon /> },
  { id: 'users', name: 'Users', icon: <UsersIcon />, badge: 12 },
]

<AxisNavigationTab
  activeTab={activeTab}
  onTabChange={setActiveTab}
  tabs={tabsWithIcons}
/>
```

**Accessibility:**
- ✅ Uses `role="tablist"` with proper ARIA labels
- ✅ Each tab has `role="tab"` with `aria-selected`
- ✅ Keyboard navigation with Arrow keys, Home, End
- ✅ Focus management for accessibility

**Dark Mode:**
- Line variant: Active border and text adapt
- Contained variant: Background and text adapt

---

### AxisCheckbox

**Purpose:** Checkbox input with support for indeterminate state.

**Category:** Interactive

**File:** `src/components/axis/AxisCheckbox.tsx`

**Props:**
```tsx
interface AxisCheckboxProps {
  checked?: boolean
  onChange?: (checked: boolean) => void
  label?: string
  hint?: string
  error?: string
  disabled?: boolean
  indeterminate?: boolean
  required?: boolean
}
```

**Basic Usage:**
```tsx
// Basic checkbox
<AxisCheckbox
  checked={agreed}
  onChange={setAgreed}
  label="I agree to the terms"
/>

// With hint
<AxisCheckbox
  checked={selected}
  onChange={setSelected}
  label="Subscribe to newsletter"
  hint="Get weekly updates via email"
/>

// With error
<AxisCheckbox
  checked={accepted}
  onChange={setAccepted}
  label="Accept terms (required)"
  error="You must accept the terms to continue"
/>

// Indeterminate state
<AxisCheckbox
  checked={allSelected}
  indeterminate={someSelected}
  onChange={handleSelectAll}
  label="Select all"
/>
```

**States:**
- Default - Unchecked, ready for interaction
- Checked - Selected with checkmark
- Indeterminate - Partially selected (dash icon)
- Hover - Visual feedback
- Focus - Visible focus ring
- Disabled - Non-interactive
- Error - Red styling with error message

**Accessibility:**
- ✅ Uses semantic `<input type="checkbox">`
- ✅ Label properly associated via id
- ✅ Error messages linked via `aria-describedby`
- ✅ Indeterminate uses `aria-checked="mixed"`
- ✅ Keyboard accessible (Space to toggle)

**Dark Mode:**
- Checkbox background and border adapt
- Checked state: `bg-main-700 border-main-900`
- All states support dark mode

---

### AxisSkeleton

**Purpose:** Loading placeholders for improved perceived performance.

**Category:** Feedback

**File:** `src/components/axis/AxisSkeleton.tsx`

**Variants:**
- `text` (default) - Text line skeleton
- `avatar` - Circular skeleton for profile pictures
- `button` - Button-shaped skeleton
- `image` - Rectangular image placeholder
- `card` - Full card skeleton with image, title, description
- `table-row` - Table row skeleton
- `input` - Form input skeleton
- `custom` - Custom dimensions

**Animation:**
- `pulse` (default) - Gentle opacity animation
- `wave` - Left-to-right shimmer effect
- `none` - No animation (static)

**Props:**
```tsx
interface AxisSkeletonProps {
  variant?: 'text' | 'avatar' | 'button' | 'image' | 'card' | 'table-row' | 'input' | 'custom'
  animation?: 'pulse' | 'wave' | 'none'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  lines?: number
  columns?: number
  width?: string
  height?: string
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full'
  fullWidth?: boolean
  label?: string
}
```

**Basic Usage:**
```tsx
// Text skeleton
<AxisSkeleton variant="text" lines={3} />

// Avatar skeleton
<AxisSkeleton variant="avatar" size="lg" />

// Button skeleton
<AxisSkeleton variant="button" size="md" />

// Card skeleton
<AxisSkeleton variant="card" />

// Table row skeleton
<AxisSkeleton variant="table-row" columns={5} />

// Custom dimensions
<AxisSkeleton
  variant="custom"
  width="200px"
  height="100px"
  animation="wave"
/>

// Loading state pattern
{loading ? (
  <AxisSkeleton variant="text" lines={5} />
) : (
  <div>{content}</div>
)}
```

**Accessibility:**
- ✅ Uses `role="status"` for loading announcement
- ✅ Proper `aria-label` for screen readers
- ✅ `aria-hidden` for decorative elements

**Dark Mode:**
- Background: `bg-neutral-200 dark:bg-neutral-700`
- Wave animation adapts colors

---

### AxisToggle

**Purpose:** Toggle/switch component for binary on/off settings.

**Category:** Interactive

**File:** `src/components/axis/AxisToggle.tsx`

**Props:**
```tsx
interface AxisToggleProps {
  checked?: boolean
  onChange?: (checked: boolean) => void
  label?: string
  hint?: string
  disabled?: boolean
  name?: string
  id?: string
  className?: string
}
```

**Basic Usage:**
```tsx
// Basic toggle
<AxisToggle
  checked={enabled}
  onChange={setEnabled}
/>

// With label
<AxisToggle
  checked={darkMode}
  onChange={setDarkMode}
  label="Dark Mode"
/>

// With label and hint
<AxisToggle
  checked={notifications}
  onChange={setNotifications}
  label="Enable notifications"
  hint="Receive email alerts for important updates"
/>

// Disabled state
<AxisToggle
  checked={true}
  disabled
  label="Always enabled"
/>
```

**States:**
- Default - Ready for interaction
- Hover - Visual feedback
- Focus - Visible focus ring
- Active (on) - Checked state with knob to the right
- Active (off) - Unchecked state with knob to the left
- Disabled - Non-interactive

**Accessibility:**
- ✅ Uses `role="switch"` with `aria-checked`
- ✅ Keyboard accessible (Space/Enter to toggle)
- ✅ Label linked via `aria-labelledby`
- ✅ Hint linked via `aria-describedby`
- ✅ Focus ring visible

**Dark Mode:**
- On state: `bg-main-900 dark:bg-main-700`
- Off state: `bg-neutral-300 dark:bg-neutral-600`
- Knob: `bg-white` (or gray when disabled)

---

## Component Summary

| Component | Category | Interactive | Primary Use Case |
|-----------|----------|-------------|------------------|
| AxisButton | Interactive | Yes | Actions, form submissions |
| AxisInput | Interactive | Yes | Text input, forms |
| AxisSelect | Interactive | Yes | Dropdown selections |
| AxisCheckbox | Interactive | Yes | Boolean selections |
| AxisToggle | Interactive | Yes | Settings, switches |
| AxisCard | Layout | Optional | Content containers |
| AxisNavigationTab | Navigation | Yes | View switching |
| AxisTable | Data Display | Yes | Tabular data with sorting/pagination |
| AxisPill | Data Display | No | Metric displays |
| AxisTag | Data Display | Optional | Labels, categories, status |
| AxisCallout | Feedback | Optional | Alerts, messages |
| AxisSkeleton | Feedback | No | Loading states |

---

## Chart Components

Reusable chart wrappers with consistent styling, balanced margins, and dark mode support.

**Location:** `src/components/charts/`

### BaseLineChart

**Purpose:** Time series line chart with consistent styling and centering.

**File:** `src/components/charts/BaseLineChart.tsx`

**Props:**
```tsx
interface BaseLineChartProps {
  data: LineChartDataPoint[];
  xAxisKey?: string;
  valueKey?: string;
  color?: string;
  showDots?: boolean;
  tooltipFormatter?: (value: number | undefined, name: string | undefined) => [string, string];
  yAxisWidth?: number;
}
```

**Usage:**
```tsx
import { BaseLineChart } from '@/components/charts';

<BaseLineChart
  data={[{ label: '01/11', value: 65 }, { label: '01/12', value: 78 }]}
  color="rgb(59, 130, 246)"
  tooltipFormatter={(value) => [(value ?? 0).toLocaleString(), 'Users']}
/>
```

### BaseHorizontalBarChart

**Purpose:** Horizontal bar chart for category comparisons.

**File:** `src/components/charts/BaseHorizontalBarChart.tsx`

**Props:**
```tsx
interface BaseHorizontalBarChartProps {
  data: HorizontalBarDataPoint[];
  categoryKey?: string;
  valueKey?: string;
  color?: string;
  tooltipFormatter?: (value: number | undefined, name: string | undefined) => [string, string];
  yAxisWidth?: number;
}
```

**Usage:**
```tsx
import { BaseHorizontalBarChart } from '@/components/charts';

<BaseHorizontalBarChart
  data={[{ label: 'Feature A', value: 8000 }]}
  color="rgb(59, 130, 246)"
  yAxisWidth={130}
/>
```

### BaseStackedBarChart

**Purpose:** Stacked vertical bar chart for multiple series comparison.

**File:** `src/components/charts/BaseStackedBarChart.tsx`

**Props:**
```tsx
interface BaseStackedBarChartProps {
  data: StackedBarDataPoint[];
  xAxisKey?: string;
  series: StackedBarSeries[];
  showLegend?: boolean;
  stackId?: string;
  yAxisWidth?: number;
}

interface StackedBarSeries {
  dataKey: string;
  name: string;
  color: string;
}
```

**Usage:**
```tsx
import { BaseStackedBarChart } from '@/components/charts';

const series = [
  { dataKey: 'new_users', name: 'New Users', color: '#22c55e' },
  { dataKey: 'returning_users', name: 'Returning Users', color: '#3b82f6' },
];

<BaseStackedBarChart data={data} series={series} showLegend={true} />
```

### BaseDonutChart

**Purpose:** Donut/pie chart for categorical distribution visualization.

**File:** `src/components/charts/BaseDonutChart.tsx`

**Props:**
```tsx
interface DonutChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

interface BaseDonutChartProps {
  data: DonutChartDataPoint[];
  colors?: string[];
  innerRadius?: string | number;
  outerRadius?: string | number;
  paddingAngle?: number;
  showLegend?: boolean;
  legendPosition?: 'top' | 'bottom' | 'left' | 'right';
  showLabels?: boolean;
  labelThreshold?: number;
  tooltipFormatter?: (value: number, name: string, percentage: string) => [string, string];
  legendFormatter?: (value: string, percentage: string) => React.ReactNode;
}
```

**Usage:**
```tsx
import { BaseDonutChart } from '@/components/charts';

const data = [
  { label: 'Desktop', value: 6500 },
  { label: 'Mobile', value: 3200 },
  { label: 'Tablet', value: 800 },
];

<BaseDonutChart
  data={data}
  showLegend={true}
  showLabels={true}
  innerRadius="50%"
  outerRadius="80%"
  tooltipFormatter={(value, name, percentage) => [
    `${value.toLocaleString()} users (${percentage}%)`,
    name
  ]}
/>
```

---

## Workspace Components

Grid layout system for drag-and-drop widget arrangement.

**Location:** `src/components/workspace/`

### GridWorkspace

**Purpose:** Container for drag-and-drop grid layout using react-grid-layout.

**File:** `src/components/workspace/GridWorkspace.tsx`

**Props:**
```tsx
interface GridWorkspaceProps {
  layout: Widget[];
  onLayoutChange?: (layout: Widget[]) => void;
  editMode?: boolean;
  widgets: Record<string, React.ReactNode>;
  onWidgetSettings?: (widgetId: string) => void;
  onWidgetExport?: (widgetId: string) => void;
}
```

**Edit Mode Features:**
- **Drag**: Widgets can be repositioned by dragging the handle icon in the header
- **Resize**: Widgets can be resized using:
  - SE corner (bottom-right) - diagonal resize
  - E edge (right side) - horizontal resize
  - S edge (bottom) - vertical resize

**Widget Constraints:**
All widgets have min/max size constraints defined in `defaultLayouts.ts`:
| Widget Type | Min Size | Max Size |
|-------------|----------|----------|
| Metrics/Scorecards | 6×3 | 12×4 |
| Line/Bar charts | 4×4 | 12×8 |
| Donut charts | 4×4 | 8×8 |
| Tables | 6×4 | 12×12 |

**Resize Handle Styling:**
Resize handles are styled in `globals.css` with:
- Gray handles by default
- Blue (`main-500`/`main-400`) on hover
- Supports light and dark modes

### Widget

**Purpose:** Base wrapper component for all dashboard widgets.

**File:** `src/components/workspace/Widget.tsx`

**Props:**
```tsx
interface WidgetComponentProps {
  title: string;
  children: ReactNode;
  editMode?: boolean;
  onRemove?: () => void;
  onSettings?: () => void;
  onExport?: () => void;
}
```

### WidgetCatalog

**Purpose:** Modal for selecting and adding new widgets.

**File:** `src/components/workspace/WidgetCatalog.tsx`

**Props:**
```tsx
interface WidgetCatalogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddWidget: (type: Widget['type'], title: string, size: { w: number; h: number }) => void;
  existingWidgets: Widget[];
}
```

### WidgetSettings

**Purpose:** Modal for editing widget configuration.

**File:** `src/components/workspace/WidgetSettings.tsx`

**Props:**
```tsx
interface WidgetSettingsProps {
  widget: Widget | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (widgetId: string, updates: Partial<Widget>) => void;
  onDelete: (widgetId: string) => void;
}
```

---

## Widget Components

Pre-built dashboard widgets for displaying metrics and charts.

**Location:** `src/components/workspace/widgets/`

### MetricsOverviewWidget

**Purpose:** Displays key metrics (users, events, page views, clients) in a card grid.

**Props:** `data: { total_users, total_events, page_views, active_clients }`, `previousData`

### TimeSeriesWidget

**Purpose:** Line chart widget using BaseLineChart.

**Props:** `data: { event_date, users, events }[]`

### BarChartWidget

**Purpose:** Horizontal bar chart widget using BaseHorizontalBarChart.

**Props:** `data: { feature, views }[]`

### DataTableWidget

**Purpose:** Data table for displaying client metrics.

**Props:** `data: { client, events, users, page_views }[]`

### UserActivityWidget

**Purpose:** DAU/WAU/MAU metrics with trend indicators and sparklines.

**Props:** `data: { dau, wau, mau, trends? }`

### NewVsReturningWidget

**Purpose:** Stacked bar chart for new vs returning users using BaseStackedBarChart.

**Props:** `data: { event_date, new_users, returning_users }[]`

### EngagementMetricsWidget

**Purpose:** Engagement metrics (sessions/user, engaged rate, bounce rate, avg time).

**Props:** `data: { sessions_per_user, engaged_rate, bounce_rate, avg_engagement_time_sec, trends? }`

### SessionSummaryWidget

**Purpose:** Total sessions and unique users with trend indicators.

**Props:** `data: { total_sessions, unique_users, trends? }`

---

## Dashboard Components

Page-level components for dashboard tabs.

**Location:** `src/components/dashboard/`

### UsersTab

**Purpose:** Chapter 2 tab with user metrics, engagement data, and GridWorkspace layout.

**Props:** `days: number`, `userType: 'all' | 'internal' | 'external'`, `editMode: boolean`

### Scorecard

**Purpose:** Single metric display card with icon, label, and large value.

**Props:** `title: string`, `value: number | string`, `icon: ReactNode`

### ClientsTable

**Purpose:** Table displaying client metrics with events, users, and page views.

**Props:** `data: { client, events, users, page_views }[]`

### TimeSeriesChart (Legacy)

**Purpose:** Line chart component using Recharts directly.

**Props:** `data: { event_date, users, events }[]`

### FeatureBarChart (Legacy)

**Purpose:** Horizontal bar chart for feature usage using Recharts directly.

**Props:** `data: { feature, views }[]`

### NewVsReturningChart (Legacy)

**Purpose:** Stacked bar chart for new vs returning users using Recharts directly.

**Props:** `data: { event_date, new_users, returning_users }[]`

---

## Global Components

App-wide utility components.

**Location:** `src/components/`

### ThemeToggle

**Purpose:** Button to toggle between light and dark mode.

**File:** `src/components/ThemeToggle.tsx`

**Behavior:**
- Persists preference to localStorage under `'theme-preference'`
- Default for new users: dark mode
- Options: 'light', 'dark', 'system'

### Logo

**Purpose:** 8020METRICS HUB brand logo with circular progress icon. Supports light/dark mode via separate SVG files.

**File:** `src/components/Logo.tsx`

**Props:** `className?: string` (default: `'h-4 w-auto'`)

### DesignKitButton

**Purpose:** Button that opens the Design Kit HTML documentation.

**File:** `src/components/DesignKitButton.tsx`

**Behavior:** Opens `public/design-kit.html` in a new browser tab.

---

## Complete Component Summary

| Category | Count | Components |
|----------|-------|------------|
| Axis UI | 12 | AxisButton, AxisInput, AxisSelect, AxisCheckbox, AxisToggle, AxisCard, AxisNavigationTab, AxisTable, AxisPill, AxisTag, AxisCallout, AxisSkeleton |
| Charts | 4 | BaseLineChart, BaseHorizontalBarChart, BaseStackedBarChart, BaseDonutChart |
| Workspace | 4 | GridWorkspace, Widget, WidgetCatalog, WidgetSettings |
| Widgets | 8 | MetricsOverviewWidget, TimeSeriesWidget, BarChartWidget, DataTableWidget, UserActivityWidget, NewVsReturningWidget, EngagementMetricsWidget, SessionSummaryWidget |
| Dashboard | 6 | UsersTab, Scorecard, ClientsTable, TimeSeriesChart, FeatureBarChart, NewVsReturningChart |
| Global | 3 | ThemeToggle, Logo, DesignKitButton |
| **Total** | **37** | |

---

## Dark Mode

### How It Works

Dark mode is enabled via a `.dark` class on the `<html>` element (class-based strategy).

### Design Principles for Light/Dark Mode

**Light Mode:**
- Should NOT be harsh white - use subtle gray backgrounds (`bg-neutral-100` for main content areas)
- Cards should "float" above the background with proper contrast
- Shadows should be subtle by default, only prominent on interaction

**Dark Mode:**
- Should NEVER use pure black - use dark grays with slight tints
- Main content area uses `bg-surface-raised` (#1f2937) - consistent with navigation
- Cards use `bg-surface-base` to maintain contrast against the raised background

### Semantic Theme Tokens

These CSS variables automatically adapt to the current theme:

**Surfaces (Backgrounds):**
- `bg-surface-base` - Main page background (white in light mode, dark gray in dark mode)
- `bg-surface-raised` - Cards, elevated containers, **main content area in dark mode**
- `bg-surface-overlay` - Modals, popovers
- `bg-surface-sunken` - Recessed areas, table headers

**Main Content Area:**
```tsx
// Recommended pattern for main content areas
className="bg-neutral-100 dark:bg-surface-raised"
```

This ensures:
- Light mode: Subtle gray (#f3f4f6) that's easier on the eyes than pure white
- Dark mode: Consistent with navigation and not pure black (#1f2937)

**Content (Text):**
- `text-content-primary` - Headings, primary text
- `text-content-secondary` - Body text, descriptions
- `text-content-tertiary` - Labels, hints, metadata
- `text-content-disabled` - Disabled text

**Strokes (Borders):**
- `border-stroke` - Default borders
- `border-stroke-subtle` - Subtle dividers
- `border-stroke-strong` - Emphasized borders

### Using Semantic Tokens (Preferred)

```tsx
// Automatically adapts to light/dark mode
<div className="bg-surface-base text-content-primary border-stroke">
  <h2 className="text-content-primary">Title</h2>
  <p className="text-content-secondary">Description</p>
</div>
```

### Manual Dark Variants (When Needed)

```tsx
<div className="bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100">
  <span className="bg-main-50 dark:bg-main-950 text-main-700 dark:text-main-300">
    Tag
  </span>
</div>
```

### Dark Mode Checklist

Before committing:
- [ ] Tested in both light and dark modes
- [ ] Contrast ratios verified (WCAG AA: 4.5:1 for text)
- [ ] No hardcoded light-only or dark-only styles
- [ ] No `bg-white` without corresponding `dark:` variant

---

## Accessibility

### Requirements (WCAG 2.1 AA)

- **Contrast ratios:** 4.5:1 for normal text, 3:1 for UI elements
- **Keyboard navigation:** All interactive elements focusable via Tab
- **Focus indicators:** Visible focus rings on all interactive elements
- **ARIA labels:** Proper labeling for screen readers
- **Motion:** Respect `prefers-reduced-motion` media query

### Focus Ring Pattern

```tsx
className="focus-visible:ring-2 focus-visible:ring-main-500 focus-visible:ring-offset-2"
```

### Color Contrast Guidelines

**For Main Color (Blue):**
- **Text:** Use `main-700` or darker for text on light backgrounds ⭐
- **Buttons:** Use `bg-main-700` with white text for primary buttons
- **Backgrounds:** Use `main-50` or `main-100` with `main-900` text
- **Never:** Use `main-500` or lighter for body text (fails contrast)

---

## Quick Reference

### Do's

✅ Use semantic tokens: `bg-main-700`, `text-success-700`
✅ Use Axis components: `<AxisButton>`, `<AxisInput>`
✅ Test both light and dark modes
✅ Verify WCAG AA contrast (4.5:1 for text)
✅ Use `px-6 py-4` for section padding

### Don'ts

❌ Use raw color names: `bg-blue-500`, `text-green-700`
❌ Use raw HTML: `<button>`, `<input>`, `<select>`
❌ Use Tailwind text sizes: `text-xs`, `text-sm`, `text-lg`
❌ Use light colors without dark mode variants
❌ Skip accessibility testing

---

---

## Changelog

### February 10, 2026 (Widget Resizing)

**Widget Resizing Feature:**
- Added widget resizing capability in edit mode
- Resize handles: SE corner, E edge (right), S edge (bottom)
- Handles turn blue on hover to indicate interactivity
- Resize handles styled in `globals.css` with light/dark mode support
- Placeholder shows dashed blue outline during resize operations
- All widgets automatically adapt content to new sizes (charts use ResponsiveContainer)

**GridWorkspace Updates:**
- Added `isResizable={editMode}` prop
- Added `resizeHandles={['se', 'e', 's']}` configuration
- Added `draggableHandle=".widget-drag-handle"` for handle-only dragging

### February 10, 2026

**AxisCallout Component Updates:**
- Added accent bar on the left (8px width) for visual type identification
- Changed "info" type to use `accent-1-*` colors (blue) for better light mode contrast
- Added `hideIcon` prop to optionally hide the icon
- Updated color tokens to only use defined shades (50, 100, 300, 500, 700, 900, 950)
- Improved structure to match Vue reference component

**Widget Component Updates:**
- Reduced shadow intensity: `shadow-md` -> `shadow-xs` by default
- Hover shadows reduced: `hover:shadow-sm` (normal mode), `hover:shadow-md` (edit mode)
- Shadows are now subtle/dim by default, only stronger on hover

**MetricsOverviewWidget Updates:**
- MetricCard hover shadow reduced from `hover:shadow-md` to `hover:shadow-sm`

**Layout/Theme Changes:**
- Light mode main content area: `bg-neutral-100` (subtle gray #f3f4f6) - easier on the eyes
- Dark mode main content area: `bg-surface-raised` (#1f2937) - consistent with navigation, not pure black
- Header title changed from "8020 Analytics Hub" to "8020METRICS HUB"
- Header font size reduced from `text-2xl font-bold` to `text-lg font-semibold`

**Design Principles Applied:**
- Light mode should not be harsh white - use subtle gray backgrounds
- Dark mode should never use pure black - use dark grays with slight tints
- Shadows should be subtle by default, only prominent on hover
- Cards should "float" above the background with proper contrast

---

**For complete implementation details, see:**
- `/Axis guide/Axis temp folder/AXIS_DESIGN_SYSTEM_GUIDE.md` - Full design system guide
- `/Design docs/HANDOFF_DESIGN_SYSTEM_JAN22_2026.md` - Brand guidelines
