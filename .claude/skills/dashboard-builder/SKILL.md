# Dashboard Builder Skill

Use this skill when building new dashboard tabs/sections (Users, Features, Clients, Traffic, Technology, Geography, Events, Insights) for the 8020METRICS HUB. This skill ensures consistency with established patterns and rules.

## When to Use

- Creating new dashboard tabs/sections
- Building new widgets for the dashboard
- Adding navigation items
- Implementing any dashboard UI components

---

## CRITICAL RULES - NO EXCEPTIONS

### 1. Tailwind Classes May Not Work - Use CSS Classes

Many Tailwind color classes don't apply correctly in this project. **Always use the custom CSS classes defined in `globals.css`** instead of Tailwind color utilities.

**Working approach:**
```tsx
// For gray backgrounds (light mode only)
<div className="light-gray-bg">

// For selected navigation tabs
<button className="selected-tab-line">
```

**DO NOT rely on:**
```tsx
// These Tailwind classes may not work:
<div className="bg-neutral-100">  // Won't apply
<div className="bg-gray-200">     // Won't apply
<div className="text-main-500">   // Won't apply
```

### 2. Light/Dark Mode Backgrounds

**Light Mode:**
- Header: White (default `bg-surface-base`)
- Navigation tabs: Gray (`light-gray-bg` class = `#f3f4f6`)
- Toolbar: Gray (`light-gray-bg` class)
- Main content area: Gray (`light-gray-bg` class)
- Widget cards: White (`bg-surface-base`)

**Dark Mode:**
- Everything uses `var(--surface-base)` = `#111827`
- Widget cards use `bg-surface-base`
- NO pure black backgrounds ever

### 3. Selected Tab Styling

Use the CSS classes in `globals.css`:
- `.selected-tab-line` - For line variant tabs
- `.selected-tab-contained` - For contained variant tabs

These classes use the semantic token `--color-tab-selection` for high contrast:
- Light mode: `main-900` (#1e3a8a - dark blue for high contrast)
- Dark mode: `neutral-50` (#f9fafb - near-white for high contrast)

### 4. Widget Shadows

Shadows must be subtle by default, only prominent on hover:
- Default: `shadow-xs`
- Hover: `shadow-sm` or `shadow-md`

```tsx
// Widget.tsx pattern
className="shadow-xs transition-all duration-200 hover:shadow-sm"
```

### 5. Color Tokens Available

Only these color shades are defined and working:
- `main`: 50, 100, 300, 500, 700, 900, 950
- `neutral`: 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950
- `success/alert/error/info`: 50, 100, 300, 500, 700, 900, 950
- `accent-1` through `accent-5`: 50, 100, 300, 500, 700, 900, 950

**DO NOT use:** 200, 400, 600, 800 for semantic colors (they don't exist)

---

## Reusable Chart Components

**CRITICAL: Always use these chart components instead of raw Recharts.**

The chart components in `src/components/charts/` provide:
- Consistent styling across all charts
- Proper centering with balanced margins
- Dark mode support
- Tooltip styling

### Available Chart Components

```typescript
import {
  BaseLineChart,
  BaseHorizontalBarChart,
  BaseStackedBarChart,
  BaseDonutChart,
} from '@/components/charts';
```

### BaseLineChart - Time Series Data

```tsx
import { BaseLineChart, LineChartDataPoint } from '@/components/charts';

const data: LineChartDataPoint[] = [
  { label: '01/11', value: 65 },
  { label: '01/12', value: 78 },
  // ...
];

<BaseLineChart
  data={data}
  color="rgb(59, 130, 246)"
  tooltipFormatter={(value) => [(value ?? 0).toLocaleString(), 'Users']}
/>
```

### BaseHorizontalBarChart - Category Comparisons

```tsx
import { BaseHorizontalBarChart, HorizontalBarDataPoint } from '@/components/charts';

const data: HorizontalBarDataPoint[] = [
  { label: 'Feature A', value: 8000 },
  { label: 'Feature B', value: 7200 },
  // ...
];

<BaseHorizontalBarChart
  data={data}
  color="rgb(59, 130, 246)"
  yAxisWidth={130}
  tooltipFormatter={(value) => [(value ?? 0).toLocaleString(), 'Views']}
/>
```

### BaseStackedBarChart - Multiple Series

```tsx
import { BaseStackedBarChart, StackedBarDataPoint, StackedBarSeries } from '@/components/charts';

const series: StackedBarSeries[] = [
  { dataKey: 'new_users', name: 'New Users', color: '#22c55e' },
  { dataKey: 'returning_users', name: 'Returning Users', color: '#3b82f6' },
];

const data: StackedBarDataPoint[] = [
  { label: '01/11', new_users: 10, returning_users: 45 },
  // ...
];

<BaseStackedBarChart
  data={data}
  series={series}
  showLegend={true}
/>
```

### BaseDonutChart - Categorical Distribution

```tsx
import { BaseDonutChart, DonutChartDataPoint } from '@/components/charts';

const data: DonutChartDataPoint[] = [
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

**Props:**
- `data` - Array of `{ label, value, color? }`
- `colors` - Color palette array (default: design system categorical colors)
- `innerRadius` - Inner radius (default: "50%", set to 0 for pie chart)
- `outerRadius` - Outer radius (default: "80%")
- `paddingAngle` - Gap between segments (default: 2)
- `showLegend` - Show legend (default: true)
- `legendPosition` - Legend position: 'top' | 'bottom' | 'left' | 'right'
- `showLabels` - Show percentage labels inside segments (default: true)
- `labelThreshold` - Min percentage to show label (default: 0.05 = 5%)
- `tooltipFormatter` - Custom tooltip formatter
- `legendFormatter` - Custom legend formatter

### Chart Margin Configuration

All chart components use balanced margins for proper centering:
```typescript
margin={{
  top: 20,
  right: 30,    // Balances Y-axis labels on left
  left: 10,
  bottom: 20,   // Or 40 with legend
}}
```

---

## Component Patterns

### Navigation Tabs

Use `AxisNavigationTab` component with these props:

#### Text-Only Tabs (Default)
```tsx
const TABS = [
  { id: 'overview', name: 'Overview' },
  { id: 'users', name: 'Users' },
  { id: 'features', name: 'Features' },
];

<AxisNavigationTab
  activeTab={activeTab}
  onTabChange={setActiveTab}
  tabs={TABS}
  variant="line"
  size="sm"
/>
```

#### Tabs with Icons
When using icons, the component automatically:
- Centers icons vertically with the text
- Provides proper spacing between icon and text (12px for md, 10px for sm)

```tsx
import { ChartBarIcon, UsersIcon, CogIcon } from '@heroicons/react/24/outline';

const TABS_WITH_ICONS = [
  { id: 'analytics', name: 'Analytics', icon: <ChartBarIcon /> },
  { id: 'users', name: 'Users', icon: <UsersIcon /> },
  { id: 'settings', name: 'Settings', icon: <CogIcon /> },
];

<AxisNavigationTab
  activeTab={activeTab}
  onTabChange={setActiveTab}
  tabs={TABS_WITH_ICONS}
  variant="line"
  size="md"
/>
```

#### Tab Spacing Rules
| Size | Tab Height | Icon Size | Icon-Text Gap |
|------|------------|-----------|---------------|
| sm   | 36px (h-9) | 16x16px   | 10px (gap-2.5)|
| md   | 52px       | 20x20px   | 12px (gap-3)  |

#### Variants
- `line` (default): Underline indicator for selected tab
- `contained`: Pill/badge style background for selected tab

### Widgets

All widgets must:
1. Be wrapped in the `Widget` component from `@/components/workspace/Widget`
2. Support export functionality via `onWidgetExport` callback
3. Support settings via `onWidgetSettings` callback
4. Have proper min/max dimensions in the layout config

Widget types available:
- `metrics` - Key metrics cards (MetricsOverviewWidget)
- `timeseries` - Line charts (TimeSeriesWidget)
- `barchart` - Bar charts (BarChartWidget)
- `table` - Data tables (DataTableWidget)
- `user-activity` - DAU/WAU/MAU metrics (UserActivityWidget)
- `new-vs-returning` - Stacked bar chart for new vs returning users (NewVsReturningWidget)
- `engagement-metrics` - Sessions, bounce rate, engagement time (EngagementMetricsWidget)
- `session-summary` - Total sessions and unique users (SessionSummaryWidget)

### Grid Layout

Use `GridWorkspace` with widgets defined in `defaultLayouts.ts`:
```typescript
{
  id: 'unique-id',
  type: 'metrics' | 'timeseries' | 'barchart' | 'table' | 'user-activity' | etc.,
  title: 'Widget Title',
  x: 0,
  y: 0,
  w: 12,  // Width in grid columns (max 12)
  h: 3,   // Height in grid rows
  minW: 4,
  minH: 3,
  maxW: 12,
  maxH: 8,
}
```

### Widget Resizing

In edit mode, widgets can be resized by dragging their edges or corner handles.

#### Resize Handles
- **SE corner** (bottom-right) - Primary resize handle, diagonal resize
- **E edge** (right side) - Horizontal resize only
- **S edge** (bottom) - Vertical resize only

Handles are only visible in edit mode and turn blue on hover for visual feedback.

#### Min/Max Constraints
Always define sensible constraints for widgets:

| Widget Type | Min Size | Max Size | Notes |
|-------------|----------|----------|-------|
| Metrics/Scorecards | 6×3 | 12×4 | Height limited for card layout |
| Line/Bar charts | 4×4 | 12×8 | Charts auto-resize via ResponsiveContainer |
| Donut charts | 4×4 | 8×8 | Keep aspect ratio close to square |
| Tables | 6×4 | 12×12 | Shows more rows when taller |

#### Responsive Widget Content
All widgets automatically adapt to size changes because:
- Charts use `<ResponsiveContainer width="100%" height="100%">` from recharts
- Tables use `overflow-auto` with flex layout
- Scorecards use CSS Grid with flexible units

#### CSS Classes for Resize Handles
Defined in `globals.css`:
- `.react-resizable-handle` - Base handle styling
- `.react-resizable-handle-se` - Corner handle (triangle lines)
- `.react-resizable-handle-e` - Right edge handle (vertical bar)
- `.react-resizable-handle-s` - Bottom edge handle (horizontal bar)

### Tab-Specific Layouts

Each tab has its own layout configuration and localStorage key:
```typescript
// In defaultLayouts.ts
export const OVERVIEW_LAYOUT_STORAGE_KEY = 'axis-workspace-layout-v1';
export const USERS_LAYOUT_STORAGE_KEY = 'axis-users-layout-v1';
// Add more as tabs are created:
// export const FEATURES_LAYOUT_STORAGE_KEY = 'axis-features-layout-v1';

export const DEFAULT_OVERVIEW_LAYOUT: Widget[] = [...];
export const DEFAULT_USERS_LAYOUT: Widget[] = [...];
```

### Loading Layout in Tab Component
```typescript
const [layout, setLayout] = useState<Widget[]>(() => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(TAB_LAYOUT_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved layout:', e);
      }
    }
  }
  return DEFAULT_TAB_LAYOUT;
});
```

### Metric Cards (inside widgets)

Use the pattern from `MetricsOverviewWidget`:
- Background: `bg-surface-raised`
- Border: `border border-stroke`
- Hover: `hover:border-stroke-strong hover:shadow-sm`
- Icon container: `bg-main-600 dark:bg-main-700` with `text-white`

---

## Page Structure Template

```tsx
return (
  <div className="min-h-screen bg-surface-base">
    <div className="w-full">
      {/* Header - WHITE background */}
      <header className="px-6 py-3 border-b border-stroke">
        {/* ... */}
      </header>

      {/* First-Level Navigation - GRAY background */}
      <nav className="px-6 border-b border-stroke light-gray-bg">
        <AxisNavigationTab ... />
      </nav>

      {/* Second-Level Navigation - GRAY background */}
      <nav className="px-6 border-b border-stroke light-gray-bg">
        <AxisNavigationTab ... />
      </nav>

      {/* Toolbar - GRAY background */}
      <div className="px-6 py-2 border-b border-stroke light-gray-bg">
        {/* Filters, toggles, etc. */}
      </div>

      {/* Main Content - GRAY background */}
      <main className="px-6 py-4 min-h-[calc(100vh-180px)] light-gray-bg">
        <GridWorkspace ... />
      </main>
    </div>
  </div>
);
```

---

## Callout Component

Use `AxisCallout` for alerts/notices:
```tsx
<AxisCallout type="info" title="Title">
  Message content
</AxisCallout>
```

Types: `info`, `success`, `alert`, `error`

The callout has:
- Left accent bar (8px)
- Uses `accent-1-*` colors for info type
- Proper dark/light mode contrast

---

## Data Fetching Pattern

```tsx
const [data, setData] = useState<DataType | null>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  fetchData();
}, [dependencies]);

async function fetchData() {
  setLoading(true);
  setError(null);
  try {
    const res = await fetch(`/api/endpoint?param=${value}`);
    const json = await res.json();
    if (json.success) {
      setData(json.data);
    } else {
      setError(json.error || 'Error fetching data');
    }
  } catch (err) {
    setError('Failed to connect to API');
  }
  setLoading(false);
}
```

---

## Trend Indicators

Metric widgets should display trend data (% change vs previous period):

### TrendData Interface
```typescript
interface TrendData {
  value: number;       // Percentage change (always positive)
  isPositive: boolean; // Whether the change is positive for the business
}
```

### TrendBadge Component Pattern
```tsx
function TrendBadge({ trend }: { trend: TrendData }) {
  const { value, isPositive } = trend;
  if (value === 0) return null;

  return (
    <div className={[
      'flex items-center gap-0.5 text-xs font-medium',
      isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
    ].join(' ')}>
      {isPositive ? (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      ) : (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      )}
      <span>{value.toFixed(1)}%</span>
    </div>
  );
}
```

### API Pattern for Trend Calculation
```typescript
function calculateTrend(current: number, previous: number, invertPositive = false): TrendData {
  if (!previous || previous === 0) {
    return { value: 0, isPositive: true };
  }
  const change = ((current - previous) / previous) * 100;
  // For metrics like bounce rate, a decrease is positive
  const isPositive = invertPositive ? change <= 0 : change >= 0;
  return { value: Math.abs(change), isPositive };
}
```

---

## Export Functionality

Each widget should support CSV export. Format functions are available in `@/lib/export.ts`:

### Available Format Functions
```typescript
import {
  exportToCSV,
  formatMetricsForExport,
  formatTimeSeriesForExport,
  formatFeatureUsageForExport,
  formatClientsForExport,
  formatUserActivityForExport,
  formatNewVsReturningForExport,
  formatEngagementMetricsForExport,
  formatSessionSummaryForExport,
} from '@/lib/export';
```

### Export Handler Pattern
```typescript
const handleWidgetExport = useCallback((widgetId: string) => {
  if (!data) return;
  const timestamp = new Date().toISOString().split('T')[0];

  switch (widgetId) {
    case 'widget-id':
      exportToCSV(
        formatDataForExport(data),
        `widget-name-${timestamp}`
      );
      break;
    default:
      console.warn(`No export handler for widget: ${widgetId}`);
  }
}, [data]);
```

### Passing to GridWorkspace
```tsx
<GridWorkspace
  layout={layout}
  onLayoutChange={handleLayoutChange}
  editMode={editMode}
  widgets={widgets}
  onWidgetSettings={handleOpenWidgetSettings}
  onWidgetExport={handleWidgetExport}  // <-- Add this
/>
```

---

## Skeleton Loaders - CRITICAL RULES

### Theme Consistency
Skeletons MUST be theme-consistent. They use CSS classes from `globals.css` that automatically adapt to light/dark mode:

```tsx
// Use these CSS classes (defined in globals.css):
// - skeleton-bg: Background color that adapts to theme
// - skeleton-animate: Pulse animation
// - skeleton-wave: Wave/shimmer animation
```

### Minimalistic Design Principle
Skeletons should be **simple blocks** that reflect the overall shape of content, NOT detailed replicas:

**DO:**
```tsx
// Simple widget placeholder
<AxisSkeleton variant="widget" height="140px" fullWidth />

// Simple chart placeholder
<AxisSkeleton variant="chart" height="300px" />
```

**DON'T:**
```tsx
// DON'T create detailed card skeletons with inner elements
<div className="border rounded-lg">
  <AxisSkeleton variant="image" />
  <AxisSkeleton variant="text" lines={2} />
  <AxisSkeleton variant="button" />
</div>
```

### Available Skeleton Variants
```typescript
// MINIMALISTIC variants (preferred for loading states):
'widget'     // Dashboard widget placeholder - simple rounded block
'chart'      // Chart placeholder - simple rounded block
'card'       // Card placeholder - simple rounded block (no inner elements)
'custom'     // Custom dimensions

// DETAIL variants (use sparingly):
'text'       // Text lines
'button'     // Button shape
'avatar'     // Circular avatar
'input'      // Input field with label
'table-row'  // Table row with columns
```

### Skeleton Loading Pattern for Tabs
```tsx
if (loading) {
  return (
    <div className="space-y-4">
      {/* Reflect the actual page structure with simple blocks */}
      <AxisSkeleton variant="widget" height="140px" fullWidth />
      <AxisSkeleton variant="chart" height="320px" />
      <AxisSkeleton variant="widget" height="140px" fullWidth />
    </div>
  );
}
```

### Theme Default
The app defaults to **dark mode** for new users. The theme is stored in localStorage under `'theme-preference'` and can be:
- `'dark'` (default for new users)
- `'light'`
- `'system'` (follows OS preference)

---

## Checklist Before Completing Any Dashboard Section

### Unified Toolbar (CRITICAL)
- [ ] **Tab uses `forwardRef` with `TabHandle` type**
- [ ] **Tab implements `useImperativeHandle`** exposing `resetLayout` and `openWidgetCatalog`
- [ ] **Ref added in page.tsx** for the new tab
- [ ] **Cases added** in `handleResetLayout` and `handleOpenWidgetCatalog` in page.tsx
- [ ] **Ref passed** to tab component in page.tsx
- [ ] **NO Reset Layout or Add Widget buttons** inside the tab component

### Styling
- [ ] Uses `light-gray-bg` class for navigation, toolbar, main content (NOT Tailwind bg classes)
- [ ] Dark mode uses `var(--surface-base)` - no pure black
- [ ] Selected tabs use `selected-tab-line` or `selected-tab-contained` classes
- [ ] Widget shadows are `shadow-xs` by default, stronger on hover
- [ ] All color tokens used are from the defined set (no 200, 400, 600, 800)
- [ ] No inline styles for colors (use CSS classes instead)

### Functionality
- [ ] Widgets support export and settings callbacks
- [ ] Grid layout has proper min/max dimensions (minW, minH, maxW, maxH)
- [ ] Widget resize handles visible and styled in edit mode
- [ ] Widgets content is responsive (charts use ResponsiveContainer)
- [ ] AxisCallout used for any alerts/notices (not custom styled divs)

### Loading States
- [ ] **Skeleton loaders are minimalistic** - use `widget`, `chart`, or `custom` variants
- [ ] **Skeletons reflect page structure** - match the general layout of the loaded content
- [ ] **No detailed skeleton elements** - no cards with inner text/button skeletons

### Testing
- [ ] Tested in both light and dark modes
- [ ] **Add Widget button works** from toolbar when in edit mode
- [ ] **Reset Layout button works** from toolbar when in edit mode

---

## File Locations

- Main page: `src/app/page.tsx`
- CSS with custom classes: `src/app/globals.css`
- **Chart components: `src/components/charts/`** (ALWAYS use these!)
- Widgets: `src/components/workspace/widgets/`
- Widget wrapper: `src/components/workspace/Widget.tsx`
- Grid workspace: `src/components/workspace/GridWorkspace.tsx`
- Layout config: `src/lib/workspace/defaultLayouts.ts`
- Axis components: `src/components/axis/`
- Navigation tab: `src/components/axis/AxisNavigationTab.tsx`
- Export utilities: `src/lib/export.ts`
- BigQuery queries: `src/lib/queries.ts`
- API routes: `src/app/api/`

### Dashboard Tab Components
- Overview tab: Inline in `src/app/page.tsx` (uses GridWorkspace directly)
- Users tab: `src/components/dashboard/UsersTab.tsx`
- Features tab: `src/components/dashboard/FeaturesTab.tsx`
- Clients tab: `src/components/dashboard/ClientsTab.tsx`
- Traffic tab: `src/components/dashboard/TrafficTab.tsx`
- Technology tab: `src/components/dashboard/TechnologyTab.tsx`
- Geography tab: `src/components/dashboard/GeographyTab.tsx`
- Events tab: `src/components/dashboard/EventsTab.tsx`
- Insights tab: `src/components/dashboard/InsightsTab.tsx`

### Widget Types Registry
Add new widget types to `src/types/widget.ts`:
```typescript
export type WidgetType =
  // Overview tab widgets
  | 'metrics'
  | 'timeseries'
  | 'barchart'
  | 'table'
  // Users tab widgets
  | 'user-activity'
  | 'new-vs-returning'
  | 'engagement-metrics'
  | 'session-summary'
  | 'first-visits-trend'
  | 'sessions-by-day'
  // Features tab widgets
  | 'feature-usage'
  | 'feature-distribution'
  | 'feature-adoption'
  | 'feature-trend'
  | 'top-pages'
  // Clients tab widgets
  | 'clients-overview'
  | 'clients-table'
  | 'client-activity-trend'
  // Traffic tab widgets
  | 'traffic-by-source'
  | 'traffic-by-medium'
  | 'traffic-browser'
  | 'top-referrers'
  // Technology tab widgets
  | 'device-category'
  | 'browser-distribution'
  | 'operating-system'
  | 'device-language'
  | 'screen-resolution'
  // Geography tab widgets
  | 'country'
  | 'continent'
  | 'region'
  | 'city'
  // Events tab widgets
  | 'event-breakdown'
  | 'event-volume-trend'
  | 'event-metrics'
  | 'scroll-depth'
  // Insights tab widgets
  | 'insights-summary'
  | 'alerts-feed'
  | 'alerts-by-category';
```

---

## Unified Toolbar Pattern - CRITICAL

### Overview

All dashboard tabs share a **unified toolbar** in the main page (`page.tsx`) that provides consistent functionality:
- **Edit Layout toggle** - Enables drag-and-drop widget repositioning
- **Add Widget button** - Opens the widget catalog to add new widgets
- **Reset Layout button** - Resets the current tab's layout to default
- **User Type filter** - Filters data by all/internal/external users
- **Time Range filter** - Selects the date range for data

### TabHandle Interface

Every tab component MUST expose methods via `forwardRef` and `useImperativeHandle` to enable the unified toolbar:

```typescript
// In src/types/widget.ts
export interface TabHandle {
  /** Reset the tab's layout to default configuration */
  resetLayout: () => void;
  /** Open the widget catalog modal */
  openWidgetCatalog: () => void;
}
```

### How It Works

1. **Parent (page.tsx)** creates refs for each tab:
```typescript
const usersTabRef = useRef<TabHandle>(null);
const featuresTabRef = useRef<TabHandle>(null);
// ... for each tab
```

2. **Parent passes refs** to tab components:
```tsx
<UsersTab ref={usersTabRef} days={days} userType={userType} editMode={editMode} />
```

3. **Unified handlers** in parent route to the active tab:
```typescript
const handleResetLayout = () => {
  switch (activeTab) {
    case 'overview':
      // Handle overview locally
      break;
    case 'users':
      usersTabRef.current?.resetLayout();
      break;
    // ... for each tab
  }
};
```

### Why This Matters

- **Consistent UX**: Users always find Add Widget and Reset Layout in the same place
- **Single toolbar**: No duplicate buttons scattered across tabs
- **Future-proof**: New tabs automatically get toolbar functionality

---

## Complete Tab Component Template

Here's the full pattern for creating a new dashboard tab with unified toolbar support:

```tsx
'use client';

import { useState, useEffect, useMemo, useCallback, forwardRef, useImperativeHandle } from 'react';
import { AxisSkeleton, AxisCallout, AxisButton } from '@/components/axis';
import { GridWorkspace, WidgetCatalog, WidgetSettings } from '@/components/workspace';
import { Widget1, Widget2 } from '@/components/workspace/widgets';
import { DEFAULT_TAB_LAYOUT, TAB_LAYOUT_STORAGE_KEY } from '@/lib/workspace/defaultLayouts';
import { Widget, TabHandle } from '@/types/widget';
import { exportToCSV, formatDataForExport } from '@/lib/export';

interface TabData {
  // Define your data shape
}

interface TabProps {
  days: number;
  userType: 'all' | 'internal' | 'external';
  editMode: boolean;
  onEditModeChange?: (editMode: boolean) => void;
}

export const NewTab = forwardRef<TabHandle, TabProps>(function NewTab(
  { days, userType, editMode },
  ref
) {
  const [data, setData] = useState<TabData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWidgetCatalog, setShowWidgetCatalog] = useState(false);
  const [selectedWidgetForSettings, setSelectedWidgetForSettings] = useState<Widget | null>(null);

  const [layout, setLayout] = useState<Widget[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(TAB_LAYOUT_STORAGE_KEY);
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { /* ignore */ }
      }
    }
    return DEFAULT_TAB_LAYOUT;
  });

  // CRITICAL: Expose methods to parent via ref for unified toolbar
  useImperativeHandle(ref, () => ({
    resetLayout: handleResetLayout,
    openWidgetCatalog: () => setShowWidgetCatalog(true),
  }));

  useEffect(() => { fetchData(); }, [days, userType]);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(\`/api/metrics/tab?days=\${days}&userType=\${userType}\`);
      const json = await res.json();
      if (json.success) setData(json.data);
      else setError(json.error || 'Error fetching data');
    } catch (err) {
      setError('Failed to connect to API');
    }
    setLoading(false);
  }

  const handleLayoutChange = (newLayout: Widget[]) => {
    setLayout(newLayout);
    if (typeof window !== 'undefined') {
      localStorage.setItem(TAB_LAYOUT_STORAGE_KEY, JSON.stringify(newLayout));
    }
  };

  // Reset layout to default
  const handleResetLayout = () => {
    setLayout(DEFAULT_TAB_LAYOUT);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TAB_LAYOUT_STORAGE_KEY);
    }
  };

  const handleWidgetExport = useCallback((widgetId: string) => {
    if (!data) return;
    const timestamp = new Date().toISOString().split('T')[0];
    switch (widgetId) {
      case 'widget-1': exportToCSV(formatDataForExport(data), \`widget-\${timestamp}\`); break;
    }
  }, [data]);

  const widgets = useMemo(() => {
    if (!data) return {};
    return {
      'widget-1': <Widget1 data={data} />,
      'widget-2': <Widget2 data={data} />,
    };
  }, [data]);

  if (loading) return <AxisSkeleton ... />;
  if (error) return <AxisCallout type="error" ... />;
  if (!data) return null;

  return (
    <div className="space-y-4">
      {editMode && (
        <div className="mb-4">
          <AxisCallout type="info" title="Edit Mode Active">
            <p className="text-body-regular">
              Drag widgets by their handle icon to reposition them.
              Resize widgets by dragging their edges.
              Your layout will be saved automatically.
            </p>
          </AxisCallout>
        </div>
      )}
      <GridWorkspace
        layout={layout}
        onLayoutChange={handleLayoutChange}
        editMode={editMode}
        widgets={widgets}
        onWidgetSettings={(id) => setSelectedWidgetForSettings(layout.find(w => w.id === id) || null)}
        onWidgetExport={handleWidgetExport}
      />

      {/* Widget Catalog Modal - controlled by parent via ref */}
      <WidgetCatalog
        isOpen={showWidgetCatalog}
        onClose={() => setShowWidgetCatalog(false)}
        onAddWidget={handleAddWidget}
        existingWidgets={layout}
      />
    </div>
  );
});  // Note: closing with ); for forwardRef
```

### Adding a New Tab - Checklist

When creating a new tab, you MUST:

1. **Use `forwardRef` wrapper** with `TabHandle` type
2. **Implement `useImperativeHandle`** exposing `resetLayout` and `openWidgetCatalog`
3. **Add ref in page.tsx**: `const newTabRef = useRef<TabHandle>(null);`
4. **Add case in unified handlers** in page.tsx for `handleResetLayout` and `handleOpenWidgetCatalog`
5. **Pass ref to component**: `<NewTab ref={newTabRef} ... />`

### DO NOT

- Put Reset Layout button inside the tab component
- Put Add Widget button inside the tab component
- Create separate toolbar controls in each tab
- Skip the `useImperativeHandle` implementation
