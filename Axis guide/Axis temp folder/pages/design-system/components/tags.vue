<script setup lang="ts">
import {
  UserIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  TagIcon,
  FunnelIcon,
  StarIcon,
} from "@heroicons/vue/20/solid";

definePageMeta({
  layout: "design-system",
});

useHead({
  title: "Tags | Components | Design System | 8020",
});

// ============================================
// TAG & PILL SPECIFICATION - AXIS DESIGN SYSTEM
// Source of truth - NO EXCEPTIONS
// ============================================

// Track copy state
const copiedCode = ref<string | null>(null);

const copyToClipboard = async (code: string) => {
  try {
    await navigator.clipboard.writeText(code);
    copiedCode.value = code;
    setTimeout(() => {
      copiedCode.value = null;
    }, 1500);
  } catch (err) {
    console.error("Failed to copy:", err);
  }
};

// Demo dismiss states
const showDismissDemo = ref(true);
const dismissedTags = ref<string[]>([]);

const resetDismissDemo = () => {
  showDismissDemo.value = true;
  dismissedTags.value = [];
};

const handleDismiss = (tag: string) => {
  dismissedTags.value.push(tag);
};

// Code examples
const codeExamples = {
  basic: `<AxisTag>Label</AxisTag>`,
  colors: `<!-- Neutral (default) -->
<AxisTag>Default</AxisTag>

<!-- Semantic colors -->
<AxisTag color="main">Main</AxisTag>
<AxisTag color="success">Active</AxisTag>
<AxisTag color="alert">Pending</AxisTag>
<AxisTag color="error">Failed</AxisTag>
<AxisTag color="info">Info</AxisTag>

<!-- Accent colors -->
<AxisTag color="accent">Accent</AxisTag>
<AxisTag color="cyan">Cyan</AxisTag>`,
  variants: `<!-- Filled (default) -->
<AxisTag color="success">Filled</AxisTag>

<!-- Outlined -->
<AxisTag color="success" variant="outlined">Outlined</AxisTag>`,
  withDot: `<!-- Status indicator with dot -->
<AxisTag color="success" dot>Active</AxisTag>
<AxisTag color="alert" dot>Pending</AxisTag>
<AxisTag color="error" dot>Failed</AxisTag>`,
  withIcon: `<AxisTag :icon-left="UserIcon" color="info">User</AxisTag>
<AxisTag :icon-left="TagIcon" color="main">Category</AxisTag>
<AxisTag :icon-left="StarIcon" color="alert">Featured</AxisTag>`,
  dismissible: `<AxisTag color="main" dismissible @dismiss="handleRemove">
  Removable
</AxisTag>`,
  sizes: `<!-- Small (24px) - for tables, compact spaces -->
<AxisTag size="sm">Small</AxisTag>

<!-- Medium (28px) - default -->
<AxisTag size="md">Medium</AxisTag>`,
  pill: `<!-- Default pill -->
<AxisPill label="Properties" value="45K" />

<!-- Good (positive metric) -->
<AxisPill label="Revenue" value="$99.9K" type="good" />

<!-- Bad (negative metric) -->
<AxisPill label="Churn" value="12%" type="bad" />`,
  pillInsightsBar: `<!-- Insights bar example -->
<div class="flex items-center gap-2">
  <AxisPill
    v-for="insight in insights"
    :key="insight.label"
    :label="insight.label"
    :value="insight.value"
  />
</div>`,
};
</script>

<template>
  <div>
    <!-- Header -->
    <div class="docs-section">
      <h1 class="text-h2 text-content-primary">Tags</h1>
      <p class="text-body-regular text-content-secondary">
        Small labels used to categorize, highlight content, or display status. Includes Tags for categorization and Pills for metrics display.
      </p>
    </div>

    <!-- Overview -->
    <div class="docs-section-highlight">
      <h2 class="text-h4 text-content-primary mb-2">Overview</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Tags are compact visual elements that communicate status, categories, or attributes.
        They support multiple colors, variants, icons, and interactive features like dismissal.
        Pills are a specialized variant for displaying key metrics with label-value pairs.
      </p>
      <div class="flex flex-wrap gap-2">
        <AxisTag>Default</AxisTag>
        <AxisTag color="main">Main</AxisTag>
        <AxisTag color="success" dot>Active</AxisTag>
        <AxisTag color="alert">Pending</AxisTag>
        <AxisTag color="error">Error</AxisTag>
        <AxisTag color="info" :icon-left="UserIcon">User</AxisTag>
        <AxisTag color="accent" variant="outlined">Outlined</AxisTag>
      </div>
    </div>

    <!-- MANDATORY RULE Notice -->
    <div class="docs-section">
      <AxisCallout type="warning" title="Mandatory Rule - No Exceptions">
        All status indicators, category labels, and filter tags in the platform MUST use the
        <code class="bg-alert-100 dark:bg-alert-900 px-1 rounded">AxisTag</code> or
        <code class="bg-alert-100 dark:bg-alert-900 px-1 rounded">AxisPill</code> components.
        Inline custom badge/tag styles are <strong>strictly prohibited</strong>.
      </AxisCallout>
    </div>

    <!-- ============================================ -->
    <!-- COLORS -->
    <!-- ============================================ -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-2">Colors</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Eight semantic color options to communicate different types of information.
      </p>

      <div class="space-y-4">
        <!-- Filled variants -->
        <div class="p-4 bg-surface-base border border-stroke rounded-lg">
          <h3 class="text-body-regular font-medium text-content-primary mb-3">Filled (Default)</h3>
          <div class="flex flex-wrap gap-2">
            <AxisTag>Neutral</AxisTag>
            <AxisTag color="main">Main</AxisTag>
            <AxisTag color="success">Success</AxisTag>
            <AxisTag color="alert">Alert</AxisTag>
            <AxisTag color="error">Error</AxisTag>
            <AxisTag color="info">Info</AxisTag>
            <AxisTag color="accent">Accent</AxisTag>
            <AxisTag color="cyan">Cyan</AxisTag>
          </div>
        </div>

        <!-- Outlined variants -->
        <div class="p-4 bg-surface-base border border-stroke rounded-lg">
          <h3 class="text-body-regular font-medium text-content-primary mb-3">Outlined</h3>
          <div class="flex flex-wrap gap-2">
            <AxisTag variant="outlined">Neutral</AxisTag>
            <AxisTag color="main" variant="outlined">Main</AxisTag>
            <AxisTag color="success" variant="outlined">Success</AxisTag>
            <AxisTag color="alert" variant="outlined">Alert</AxisTag>
            <AxisTag color="error" variant="outlined">Error</AxisTag>
            <AxisTag color="info" variant="outlined">Info</AxisTag>
            <AxisTag color="accent" variant="outlined">Accent</AxisTag>
            <AxisTag color="cyan" variant="outlined">Cyan</AxisTag>
          </div>
        </div>

        <!-- Disabled -->
        <div class="p-4 bg-surface-base border border-stroke rounded-lg">
          <h3 class="text-body-regular font-medium text-content-primary mb-3">Disabled</h3>
          <div class="flex flex-wrap gap-2">
            <AxisTag disabled>Disabled Filled</AxisTag>
            <AxisTag variant="outlined" disabled>Disabled Outlined</AxisTag>
          </div>
        </div>
      </div>

      <!-- Color usage guide -->
      <div class="mt-4 overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="border-b border-stroke">
              <th class="py-2 pr-4 text-label-bold text-content-secondary">Color</th>
              <th class="py-2 pr-4 text-label-bold text-content-secondary">Example</th>
              <th class="py-2 text-label-bold text-content-secondary">Use For</th>
            </tr>
          </thead>
          <tbody class="text-body-regular text-content-secondary">
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised px-1 rounded">neutral</code></td>
              <td class="py-2 pr-4"><AxisTag size="sm">Label</AxisTag></td>
              <td class="py-2 text-label">General categories, default state</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised px-1 rounded">main</code></td>
              <td class="py-2 pr-4"><AxisTag color="main" size="sm">Primary</AxisTag></td>
              <td class="py-2 text-label">Primary categorization, brand-related</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised px-1 rounded">success</code></td>
              <td class="py-2 pr-4"><AxisTag color="success" size="sm">Active</AxisTag></td>
              <td class="py-2 text-label">Active, completed, positive status</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised px-1 rounded">alert</code></td>
              <td class="py-2 pr-4"><AxisTag color="alert" size="sm">Pending</AxisTag></td>
              <td class="py-2 text-label">Pending, warnings, caution</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised px-1 rounded">error</code></td>
              <td class="py-2 pr-4"><AxisTag color="error" size="sm">Failed</AxisTag></td>
              <td class="py-2 text-label">Errors, failed, critical issues</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised px-1 rounded">info</code></td>
              <td class="py-2 pr-4"><AxisTag color="info" size="sm">Info</AxisTag></td>
              <td class="py-2 text-label">Informational, references, links</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised px-1 rounded">accent</code></td>
              <td class="py-2 pr-4"><AxisTag color="accent" size="sm">Special</AxisTag></td>
              <td class="py-2 text-label">Special highlights, premium features</td>
            </tr>
            <tr>
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised px-1 rounded">cyan</code></td>
              <td class="py-2 pr-4"><AxisTag color="cyan" size="sm">Alt</AxisTag></td>
              <td class="py-2 text-label">Alternative accent, secondary highlights</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- STATUS DOT -->
    <!-- ============================================ -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-2">Status Dot</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Add a status indicator dot for quick visual recognition of states.
      </p>

      <div class="p-4 bg-surface-base border border-stroke rounded-lg">
        <div class="flex items-start justify-between mb-3">
          <div>
            <h3 class="text-body-regular font-medium text-content-primary">With Dot Indicator</h3>
            <p class="text-label text-content-secondary">Shows a colored dot on the left side of the tag.</p>
          </div>
          <code class="text-label bg-surface-raised dark:bg-neutral-800 px-2 py-1 rounded text-content-secondary">dot</code>
        </div>
        <div class="flex flex-wrap gap-2">
          <AxisTag dot>Neutral</AxisTag>
          <AxisTag color="success" dot>Active</AxisTag>
          <AxisTag color="alert" dot>Pending</AxisTag>
          <AxisTag color="error" dot>Failed</AxisTag>
          <AxisTag color="info" dot>Processing</AxisTag>
        </div>
      </div>

      <div class="mt-4 p-3 bg-info-50 dark:bg-info-900/30 border border-info-200 dark:border-info-800 rounded-lg">
        <p class="text-label text-info-800 dark:text-info-300">
          <strong>Tip:</strong> Use dots for status indicators in tables or lists where quick visual
          scanning is important. The dot provides additional visual distinction beyond color.
        </p>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- WITH ICONS -->
    <!-- ============================================ -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-2">With Icons</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Add an icon for additional visual context. Icons replace the dot when both are specified.
      </p>

      <div class="p-4 bg-surface-base border border-stroke rounded-lg">
        <div class="flex items-start justify-between mb-3">
          <div>
            <h3 class="text-body-regular font-medium text-content-primary">Icon Left</h3>
            <p class="text-label text-content-secondary">Pass any Heroicons/20 solid component.</p>
          </div>
          <code class="text-label bg-surface-raised dark:bg-neutral-800 px-2 py-1 rounded text-content-secondary">:icon-left="Icon"</code>
        </div>
        <div class="flex flex-wrap gap-2">
          <AxisTag :icon-left="UserIcon" color="info">User</AxisTag>
          <AxisTag :icon-left="TagIcon" color="main">Category</AxisTag>
          <AxisTag :icon-left="StarIcon" color="alert">Featured</AxisTag>
          <AxisTag :icon-left="CheckCircleIcon" color="success">Verified</AxisTag>
          <AxisTag :icon-left="ExclamationTriangleIcon" color="error">Warning</AxisTag>
          <AxisTag :icon-left="FunnelIcon" color="accent">Filtered</AxisTag>
        </div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- DISMISSIBLE -->
    <!-- ============================================ -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-2">Dismissible</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Add a dismiss button to allow users to remove tags, useful for filters or selections.
      </p>

      <div class="p-4 bg-surface-base border border-stroke rounded-lg">
        <div class="flex items-start justify-between mb-3">
          <div>
            <h3 class="text-body-regular font-medium text-content-primary">With Dismiss Button</h3>
            <p class="text-label text-content-secondary">
              Emits a <code class="bg-surface-raised dark:bg-neutral-800 px-1 rounded">dismiss</code> event when clicked.
            </p>
          </div>
          <code class="text-label bg-surface-raised dark:bg-neutral-800 px-2 py-1 rounded text-content-secondary">dismissible</code>
        </div>
        <div class="flex flex-wrap gap-2 items-center">
          <AxisTag
            v-if="!dismissedTags.includes('tag1')"
            color="main"
            dismissible
            @dismiss="handleDismiss('tag1')"
          >
            Filter A
          </AxisTag>
          <AxisTag
            v-if="!dismissedTags.includes('tag2')"
            color="info"
            dismissible
            @dismiss="handleDismiss('tag2')"
          >
            Filter B
          </AxisTag>
          <AxisTag
            v-if="!dismissedTags.includes('tag3')"
            color="accent"
            dismissible
            @dismiss="handleDismiss('tag3')"
          >
            Filter C
          </AxisTag>
          <AxisButton
            v-if="dismissedTags.length > 0"
            variant="ghost"
            size="sm"
            @click="resetDismissDemo"
          >
            Reset Demo
          </AxisButton>
        </div>
      </div>

      <!-- Icon + Dismiss -->
      <div class="mt-4 p-4 bg-surface-base border border-stroke rounded-lg">
        <h3 class="text-body-regular font-medium text-content-primary mb-3">Icon and Dismiss</h3>
        <p class="text-label text-content-secondary mb-3">Combine icons with dismissible for filter tags.</p>
        <div class="flex flex-wrap gap-2">
          <AxisTag :icon-left="UserIcon" color="info" dismissible>John Doe</AxisTag>
          <AxisTag :icon-left="TagIcon" color="main" dismissible>Residential</AxisTag>
          <AxisTag :icon-left="StarIcon" color="alert" dismissible>High Priority</AxisTag>
        </div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- SIZES -->
    <!-- ============================================ -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-2">Sizes</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Two sizes available for different contexts.
      </p>

      <div class="p-4 bg-surface-base border border-stroke rounded-lg">
        <div class="space-y-4">
          <!-- Small -->
          <div>
            <div class="flex items-center gap-2 mb-2">
              <h3 class="text-body-regular font-medium text-content-primary">Small (24px)</h3>
              <code class="text-label bg-surface-raised dark:bg-neutral-800 px-2 py-0.5 rounded text-content-secondary">size="sm"</code>
            </div>
            <p class="text-label text-content-secondary mb-2">For tables, compact spaces, inline with text.</p>
            <div class="flex flex-wrap gap-2">
              <AxisTag size="sm">Small</AxisTag>
              <AxisTag size="sm" color="success" dot>Active</AxisTag>
              <AxisTag size="sm" color="info" :icon-left="UserIcon">User</AxisTag>
              <AxisTag size="sm" color="main" dismissible>Filter</AxisTag>
            </div>
          </div>

          <!-- Medium -->
          <div>
            <div class="flex items-center gap-2 mb-2">
              <h3 class="text-body-regular font-medium text-content-primary">Medium (28px)</h3>
              <code class="text-label bg-surface-raised dark:bg-neutral-800 px-2 py-0.5 rounded text-content-secondary">size="md"</code>
              <span class="text-label text-content-tertiary">(default)</span>
            </div>
            <p class="text-label text-content-secondary mb-2">Standard size for most use cases.</p>
            <div class="flex flex-wrap gap-2">
              <AxisTag size="md">Medium</AxisTag>
              <AxisTag size="md" color="success" dot>Active</AxisTag>
              <AxisTag size="md" color="info" :icon-left="UserIcon">User</AxisTag>
              <AxisTag size="md" color="main" dismissible>Filter</AxisTag>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- PILLS - METRIC DISPLAY -->
    <!-- ============================================ -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-2">Pills (Metric Display)</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Pills are compact, non-interactive labels for displaying key metrics with label-value pairs.
        Use them for insights bars, dashboards, and data overviews.
      </p>

      <!-- Basic Pills -->
      <div class="p-4 bg-surface-base border border-stroke rounded-lg mb-4">
        <h3 class="text-body-regular font-medium text-content-primary mb-3">Types</h3>
        <div class="flex gap-2">
          <AxisPill label="Properties" value="45K" />
          <AxisPill label="Revenue" value="$99.9K" type="good" />
          <AxisPill label="Churn" value="12%" type="bad" />
        </div>
      </div>

      <!-- Insights Bar Example (Like Property List) -->
      <div class="p-4 bg-surface-sunken border border-stroke rounded-lg">
        <h3 class="text-body-regular font-medium text-content-primary mb-3">Insights Bar Example</h3>
        <p class="text-label text-content-secondary mb-3">
          This is how pills appear in the property list insights bar.
        </p>
        <div class="flex items-center gap-2">
          <AxisPill label="Properties" value="45K" />
          <AxisPill label="Residential" value="39K" />
          <AxisPill label="Roof Age >15yrs" value="13K" />
          <AxisPill label="Storm Damaged" value="2.1K" />
          <AxisPill label="High Roof Score" value="8.9K" />
          <AxisPill label="Roof Score >60" value="15K" />
        </div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- USAGE GUIDELINES -->
    <!-- ============================================ -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-3">Usage Guidelines</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Do's -->
        <div>
          <h3 class="text-h5 text-success-700 dark:text-success-400 mb-3">Do</h3>
          <ul class="space-y-2 text-body-regular text-content-secondary">
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1 shrink-0">&#x2713;</span>
              <span>Use semantic colors that match the meaning (success for active, error for failed)</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1 shrink-0">&#x2713;</span>
              <span>Keep tag text short and scannable (1-2 words)</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1 shrink-0">&#x2713;</span>
              <span>Use dots for status indicators in tables</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1 shrink-0">&#x2713;</span>
              <span>Use dismissible tags for user-applied filters</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1 shrink-0">&#x2713;</span>
              <span>Use Pills for numeric metrics with labels</span>
            </li>
          </ul>
        </div>

        <!-- Don'ts -->
        <div>
          <h3 class="text-h5 text-error-700 dark:text-error-400 mb-3">Don't</h3>
          <ul class="space-y-2 text-body-regular text-content-secondary">
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1 shrink-0">&#x2717;</span>
              <span>Mix filled and outlined variants in the same context</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1 shrink-0">&#x2717;</span>
              <span>Use tags for long text or sentences</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1 shrink-0">&#x2717;</span>
              <span>Use random colors - stick to semantic meanings</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1 shrink-0">&#x2717;</span>
              <span>Create custom inline badge styles</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1 shrink-0">&#x2717;</span>
              <span>Use Pills for interactive/clickable elements</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- WHEN TO USE -->
    <!-- ============================================ -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-3">When to Use</h2>

      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="border-b border-stroke">
              <th class="py-2 pr-4 text-label-bold text-content-secondary">Scenario</th>
              <th class="py-2 pr-4 text-label-bold text-content-secondary">Component</th>
              <th class="py-2 text-label-bold text-content-secondary">Why</th>
            </tr>
          </thead>
          <tbody class="text-body-regular text-content-secondary">
            <tr class="border-b border-stroke-subtle">
              <td class="py-3 pr-4">User active/inactive status</td>
              <td class="py-3 pr-4"><code class="text-label bg-success-100 dark:bg-success-900 px-1.5 py-0.5 rounded text-success-700 dark:text-success-300">AxisTag</code> with dot</td>
              <td class="py-3 text-label">Quick visual status recognition</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-3 pr-4">User role badge</td>
              <td class="py-3 pr-4"><code class="text-label bg-success-100 dark:bg-success-900 px-1.5 py-0.5 rounded text-success-700 dark:text-success-300">AxisTag</code></td>
              <td class="py-3 text-label">Categorize by role type</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-3 pr-4">Applied filter chips</td>
              <td class="py-3 pr-4"><code class="text-label bg-success-100 dark:bg-success-900 px-1.5 py-0.5 rounded text-success-700 dark:text-success-300">AxisTag</code> dismissible</td>
              <td class="py-3 text-label">User can remove filters</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-3 pr-4">Property score in table</td>
              <td class="py-3 pr-4"><code class="text-label bg-success-100 dark:bg-success-900 px-1.5 py-0.5 rounded text-success-700 dark:text-success-300">AxisTag</code> size="sm"</td>
              <td class="py-3 text-label">Color-coded score display</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-3 pr-4">Dashboard metric summary</td>
              <td class="py-3 pr-4"><code class="text-label bg-success-100 dark:bg-success-900 px-1.5 py-0.5 rounded text-success-700 dark:text-success-300">AxisPill</code></td>
              <td class="py-3 text-label">Label-value pair for metrics</td>
            </tr>
            <tr>
              <td class="py-3 pr-4">Feature category label</td>
              <td class="py-3 pr-4"><code class="text-label bg-success-100 dark:bg-success-900 px-1.5 py-0.5 rounded text-success-700 dark:text-success-300">AxisTag</code> with icon</td>
              <td class="py-3 text-label">Icon adds visual context</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- API REFERENCE - AxisTag -->
    <!-- ============================================ -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-3">API Reference - AxisTag</h2>

      <!-- Props -->
      <h3 class="text-body-regular font-medium text-content-primary mb-2">Props</h3>
      <div class="overflow-x-auto mb-6">
        <table class="w-full text-left">
          <thead>
            <tr class="border-b border-stroke">
              <th class="py-2 pr-4 text-label-bold text-content-secondary">Prop</th>
              <th class="py-2 pr-4 text-label-bold text-content-secondary">Type</th>
              <th class="py-2 pr-4 text-label-bold text-content-secondary">Default</th>
              <th class="py-2 text-label-bold text-content-secondary">Description</th>
            </tr>
          </thead>
          <tbody class="text-body-regular text-content-secondary">
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised px-1.5 py-0.5 rounded">color</code></td>
              <td class="py-2 pr-4 text-label">'neutral' | 'main' | 'success' | 'alert' | 'error' | 'info' | 'accent' | 'cyan'</td>
              <td class="py-2 pr-4 text-label">'neutral'</td>
              <td class="py-2 text-label">Tag color scheme</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised px-1.5 py-0.5 rounded">size</code></td>
              <td class="py-2 pr-4 text-label">'sm' | 'md'</td>
              <td class="py-2 pr-4 text-label">'md'</td>
              <td class="py-2 text-label">Tag size (24px or 28px height)</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised px-1.5 py-0.5 rounded">variant</code></td>
              <td class="py-2 pr-4 text-label">'filled' | 'outlined'</td>
              <td class="py-2 pr-4 text-label">'filled'</td>
              <td class="py-2 text-label">Tag style variant</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised px-1.5 py-0.5 rounded">dot</code></td>
              <td class="py-2 pr-4 text-label">boolean</td>
              <td class="py-2 pr-4 text-label">false</td>
              <td class="py-2 text-label">Show status dot on left</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised px-1.5 py-0.5 rounded">icon-left</code></td>
              <td class="py-2 pr-4 text-label">Component</td>
              <td class="py-2 pr-4 text-label">null</td>
              <td class="py-2 text-label">Icon component to display on left</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised px-1.5 py-0.5 rounded">dismissible</code></td>
              <td class="py-2 pr-4 text-label">boolean</td>
              <td class="py-2 pr-4 text-label">false</td>
              <td class="py-2 text-label">Show dismiss (X) button</td>
            </tr>
            <tr>
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised px-1.5 py-0.5 rounded">disabled</code></td>
              <td class="py-2 pr-4 text-label">boolean</td>
              <td class="py-2 pr-4 text-label">false</td>
              <td class="py-2 text-label">Disable the tag (visual only)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Events -->
      <h3 class="text-body-regular font-medium text-content-primary mb-2">Events</h3>
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="border-b border-stroke">
              <th class="py-2 pr-4 text-label-bold text-content-secondary">Event</th>
              <th class="py-2 pr-4 text-label-bold text-content-secondary">Payload</th>
              <th class="py-2 text-label-bold text-content-secondary">Description</th>
            </tr>
          </thead>
          <tbody class="text-body-regular text-content-secondary">
            <tr>
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised px-1.5 py-0.5 rounded">dismiss</code></td>
              <td class="py-2 pr-4 text-label">none</td>
              <td class="py-2 text-label">Emitted when dismiss button is clicked</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- API REFERENCE - AxisPill -->
    <!-- ============================================ -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-3">API Reference - AxisPill</h2>

      <!-- Props -->
      <h3 class="text-body-regular font-medium text-content-primary mb-2">Props</h3>
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="border-b border-stroke">
              <th class="py-2 pr-4 text-label-bold text-content-secondary">Prop</th>
              <th class="py-2 pr-4 text-label-bold text-content-secondary">Type</th>
              <th class="py-2 pr-4 text-label-bold text-content-secondary">Default</th>
              <th class="py-2 text-label-bold text-content-secondary">Description</th>
            </tr>
          </thead>
          <tbody class="text-body-regular text-content-secondary">
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised px-1.5 py-0.5 rounded">label</code></td>
              <td class="py-2 pr-4 text-label">string</td>
              <td class="py-2 pr-4 text-label">required</td>
              <td class="py-2 text-label">The metric label/description</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised px-1.5 py-0.5 rounded">value</code></td>
              <td class="py-2 pr-4 text-label">string | number</td>
              <td class="py-2 pr-4 text-label">required</td>
              <td class="py-2 text-label">The metric value to display</td>
            </tr>
            <tr>
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised px-1.5 py-0.5 rounded">type</code></td>
              <td class="py-2 pr-4 text-label">'default' | 'good' | 'bad'</td>
              <td class="py-2 pr-4 text-label">'default'</td>
              <td class="py-2 text-label">Value color - green for good, red for bad</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- ACCESSIBILITY -->
    <!-- ============================================ -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-3">Accessibility</h2>

      <div class="space-y-4">
        <div class="p-4 bg-info-50 dark:bg-info-950 border border-info-200 dark:border-info-800 rounded-lg">
          <h3 class="text-body-regular font-medium text-info-900 dark:text-info-100 mb-2">Semantic Markup</h3>
          <ul class="text-label text-info-800 dark:text-info-300 space-y-1">
            <li><strong>Tags:</strong> Use <code class="bg-info-100 dark:bg-info-900 px-1 rounded">&lt;span&gt;</code> element (non-interactive by default)</li>
            <li><strong>Dismiss button:</strong> Uses <code class="bg-info-100 dark:bg-info-900 px-1 rounded">&lt;button&gt;</code> with <code class="bg-info-100 dark:bg-info-900 px-1 rounded">aria-label="Remove tag"</code></li>
            <li><strong>Icons and dots:</strong> <code class="bg-info-100 dark:bg-info-900 px-1 rounded">aria-hidden="true"</code> (decorative)</li>
          </ul>
        </div>

        <div class="p-4 bg-success-50 dark:bg-success-950 border border-success-200 dark:border-success-800 rounded-lg">
          <h3 class="text-body-regular font-medium text-success-900 dark:text-success-100 mb-2">Color Contrast</h3>
          <p class="text-label text-success-800 dark:text-success-300">
            All text colors meet WCAG AA contrast requirements against their backgrounds.
            The dot and filled backgrounds provide additional visual distinction beyond color alone.
          </p>
        </div>

        <div class="p-4 bg-surface-raised border border-stroke rounded-lg">
          <h3 class="text-body-regular font-medium text-content-primary mb-2">Keyboard Navigation</h3>
          <ul class="text-label text-content-secondary space-y-1">
            <li>Dismiss buttons are focusable and activatable with Enter/Space</li>
            <li>Focus ring visible on keyboard navigation</li>
            <li>Disabled tags prevent interaction on dismiss button</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- CODE EXAMPLES -->
    <!-- ============================================ -->
    <div class="docs-section-last">
      <h2 class="text-h4 text-content-primary mb-3">Code Examples</h2>

      <div class="space-y-4">
        <!-- Basic -->
        <div class="border border-stroke rounded-lg overflow-hidden">
          <div class="px-4 py-2 bg-surface-raised border-b border-stroke flex items-center justify-between">
            <span class="text-label-bold text-content-secondary">Basic Tag</span>
            <button
              class="text-label text-main-700 dark:text-main-400 hover:text-main-900 dark:hover:text-main-200"
              @click="copyToClipboard(codeExamples.basic)"
            >
              {{ copiedCode === codeExamples.basic ? 'Copied!' : 'Copy' }}
            </button>
          </div>
          <pre class="p-4 text-label bg-neutral-900 overflow-x-auto"><code class="text-neutral-100">{{ codeExamples.basic }}</code></pre>
        </div>

        <!-- Colors -->
        <div class="border border-stroke rounded-lg overflow-hidden">
          <div class="px-4 py-2 bg-surface-raised border-b border-stroke flex items-center justify-between">
            <span class="text-label-bold text-content-secondary">All Colors</span>
            <button
              class="text-label text-main-700 dark:text-main-400 hover:text-main-900 dark:hover:text-main-200"
              @click="copyToClipboard(codeExamples.colors)"
            >
              {{ copiedCode === codeExamples.colors ? 'Copied!' : 'Copy' }}
            </button>
          </div>
          <pre class="p-4 text-label bg-neutral-900 overflow-x-auto"><code class="text-neutral-100">{{ codeExamples.colors }}</code></pre>
        </div>

        <!-- With Dot -->
        <div class="border border-stroke rounded-lg overflow-hidden">
          <div class="px-4 py-2 bg-surface-raised border-b border-stroke flex items-center justify-between">
            <span class="text-label-bold text-content-secondary">Status Dot</span>
            <button
              class="text-label text-main-700 dark:text-main-400 hover:text-main-900 dark:hover:text-main-200"
              @click="copyToClipboard(codeExamples.withDot)"
            >
              {{ copiedCode === codeExamples.withDot ? 'Copied!' : 'Copy' }}
            </button>
          </div>
          <pre class="p-4 text-label bg-neutral-900 overflow-x-auto"><code class="text-neutral-100">{{ codeExamples.withDot }}</code></pre>
        </div>

        <!-- With Icon -->
        <div class="border border-stroke rounded-lg overflow-hidden">
          <div class="px-4 py-2 bg-surface-raised border-b border-stroke flex items-center justify-between">
            <span class="text-label-bold text-content-secondary">With Icons</span>
            <button
              class="text-label text-main-700 dark:text-main-400 hover:text-main-900 dark:hover:text-main-200"
              @click="copyToClipboard(codeExamples.withIcon)"
            >
              {{ copiedCode === codeExamples.withIcon ? 'Copied!' : 'Copy' }}
            </button>
          </div>
          <pre class="p-4 text-label bg-neutral-900 overflow-x-auto"><code class="text-neutral-100">{{ codeExamples.withIcon }}</code></pre>
        </div>

        <!-- Dismissible -->
        <div class="border border-stroke rounded-lg overflow-hidden">
          <div class="px-4 py-2 bg-surface-raised border-b border-stroke flex items-center justify-between">
            <span class="text-label-bold text-content-secondary">Dismissible</span>
            <button
              class="text-label text-main-700 dark:text-main-400 hover:text-main-900 dark:hover:text-main-200"
              @click="copyToClipboard(codeExamples.dismissible)"
            >
              {{ copiedCode === codeExamples.dismissible ? 'Copied!' : 'Copy' }}
            </button>
          </div>
          <pre class="p-4 text-label bg-neutral-900 overflow-x-auto"><code class="text-neutral-100">{{ codeExamples.dismissible }}</code></pre>
        </div>

        <!-- Pill -->
        <div class="border border-stroke rounded-lg overflow-hidden">
          <div class="px-4 py-2 bg-surface-raised border-b border-stroke flex items-center justify-between">
            <span class="text-label-bold text-content-secondary">Pills (Metrics)</span>
            <button
              class="text-label text-main-700 dark:text-main-400 hover:text-main-900 dark:hover:text-main-200"
              @click="copyToClipboard(codeExamples.pill)"
            >
              {{ copiedCode === codeExamples.pill ? 'Copied!' : 'Copy' }}
            </button>
          </div>
          <pre class="p-4 text-label bg-neutral-900 overflow-x-auto"><code class="text-neutral-100">{{ codeExamples.pill }}</code></pre>
        </div>

        <!-- Pill Insights Bar -->
        <div class="border border-stroke rounded-lg overflow-hidden">
          <div class="px-4 py-2 bg-surface-raised border-b border-stroke flex items-center justify-between">
            <span class="text-label-bold text-content-secondary">Pills - Insights Bar</span>
            <button
              class="text-label text-main-700 dark:text-main-400 hover:text-main-900 dark:hover:text-main-200"
              @click="copyToClipboard(codeExamples.pillInsightsBar)"
            >
              {{ copiedCode === codeExamples.pillInsightsBar ? 'Copied!' : 'Copy' }}
            </button>
          </div>
          <pre class="p-4 text-label bg-neutral-900 overflow-x-auto"><code class="text-neutral-100">{{ codeExamples.pillInsightsBar }}</code></pre>
        </div>
      </div>
    </div>
  </div>
</template>
