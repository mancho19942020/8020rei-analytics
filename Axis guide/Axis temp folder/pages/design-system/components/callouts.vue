<script setup lang="ts">
import {
  CheckIcon,
  XMarkIcon,
  ArrowRightIcon,
  ArrowPathIcon,
  BookOpenIcon,
} from "@heroicons/vue/24/outline";

definePageMeta({
  layout: "design-system",
});

useHead({
  title: "Callouts | Components | Design System | 8020",
});

// ============================================
// CALLOUT SPECIFICATION - AXIS DESIGN SYSTEM
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

// Demo dismiss state
const showDismissDemo = ref(true);
const resetDismissDemo = () => {
  showDismissDemo.value = false;
  setTimeout(() => {
    showDismissDemo.value = true;
  }, 100);
};

// Code examples
const codeExamples = {
  basic: "<AxisCallout>This is an informational message.</AxisCallout>",
  withTitle: `<AxisCallout title="Important Notice">
  This callout has a title for added emphasis.
</AxisCallout>`,
  types: `<!-- Info (default) -->
<AxisCallout type="info">General information or tips.</AxisCallout>

<!-- Success -->
<AxisCallout type="success">Operation completed successfully.</AxisCallout>

<!-- Warning -->
<AxisCallout type="warning">Please review before continuing.</AxisCallout>

<!-- Error -->
<AxisCallout type="error">An error occurred. Please try again.</AxisCallout>`,
  dismissible: ["<scr", "ipt setup>"].join("") + `
const showCallout = ref(true)
` + ["</scr", "ipt>"].join("") + `

` + ["<temp", "late>"].join("") + `
  <AxisCallout
    v-if="showCallout"
    dismissible
    @dismiss="showCallout = false"
  >
    This callout can be dismissed.
  </AxisCallout>
` + ["</temp", "late>"].join(""),
  withActions: `<AxisCallout type="error" title="Connection Failed">
  Unable to connect to the server.
  <template #actions>
    <AxisButton variant="ghost" size="sm" :icon-left="ArrowPathIcon">
      Retry
    </AxisButton>
    <AxisButton variant="ghost" size="sm">
      Learn More
    </AxisButton>
  </template>
</AxisCallout>`,
};
</script>

<template>
  <div>
    <!-- Header -->
    <div class="docs-section">
      <h1 class="text-h2 text-content-primary">Callouts</h1>
      <p class="text-body-regular text-content-secondary">
        Contextual feedback components for displaying important messages, tips, warnings, or errors.
      </p>
    </div>

    <!-- Overview -->
    <div class="docs-section-highlight">
      <h2 class="text-h4 text-content-primary mb-2">Overview</h2>
      <p class="text-body-regular text-content-secondary mb-3">
        Callouts draw attention to important information within a page. They feature a colored accent bar
        on the left for quick visual identification of the message type. Use them for tips, warnings,
        errors, or success confirmations that need to persist on the page.
      </p>
      <div class="space-y-3">
        <AxisCallout>This is a default informational callout.</AxisCallout>
        <AxisCallout type="success" title="Success">Your changes have been saved.</AxisCallout>
      </div>
    </div>

    <!-- MANDATORY RULE Notice -->
    <div class="docs-section">
      <AxisCallout type="warning" title="Mandatory Rule - No Exceptions">
        All contextual feedback in the platform MUST use the <code class="bg-alert-100 dark:bg-alert-900 px-1 rounded">AxisCallout</code> component.
        Inline custom callout styles are <strong>strictly prohibited</strong>.
      </AxisCallout>
    </div>

    <!-- ============================================ -->
    <!-- TYPES -->
    <!-- ============================================ -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-2">Types</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Four semantic types to communicate different levels of importance and feedback.
      </p>

      <div class="space-y-6">
        <!-- Info -->
        <div class="p-4 bg-surface-base border border-stroke rounded-lg">
          <div class="flex items-start justify-between mb-3">
            <div>
              <h3 class="text-body-regular font-medium text-content-primary">Info (Default)</h3>
              <p class="text-label text-content-secondary">General information, tips, guidance, or helpful context.</p>
            </div>
            <code class="text-label bg-surface-raised dark:bg-neutral-800 px-2 py-1 rounded text-content-secondary">type="info"</code>
          </div>
          <AxisCallout>
            Tip: You can use keyboard shortcuts to navigate faster. Press <kbd class="px-1 bg-accent-1-100 dark:bg-accent-1-900 rounded">?</kbd> for a list.
          </AxisCallout>
        </div>

        <!-- Success -->
        <div class="p-4 bg-surface-base border border-stroke rounded-lg">
          <div class="flex items-start justify-between mb-3">
            <div>
              <h3 class="text-body-regular font-medium text-content-primary">Success</h3>
              <p class="text-label text-content-secondary">Confirmations, completed actions, positive feedback.</p>
            </div>
            <code class="text-label bg-surface-raised dark:bg-neutral-800 px-2 py-1 rounded text-content-secondary">type="success"</code>
          </div>
          <AxisCallout type="success" title="Changes Saved">
            Your profile has been updated successfully.
          </AxisCallout>
        </div>

        <!-- Warning -->
        <div class="p-4 bg-surface-base border border-stroke rounded-lg">
          <div class="flex items-start justify-between mb-3">
            <div>
              <h3 class="text-body-regular font-medium text-content-primary">Warning</h3>
              <p class="text-label text-content-secondary">Cautions, important notices, potential issues to be aware of.</p>
            </div>
            <code class="text-label bg-surface-raised dark:bg-neutral-800 px-2 py-1 rounded text-content-secondary">type="warning"</code>
          </div>
          <AxisCallout type="warning" title="Limited Access">
            You are viewing this page in read-only mode. Some features may be unavailable.
          </AxisCallout>
        </div>

        <!-- Error -->
        <div class="p-4 bg-surface-base border border-stroke rounded-lg">
          <div class="flex items-start justify-between mb-3">
            <div>
              <h3 class="text-body-regular font-medium text-content-primary">Error</h3>
              <p class="text-label text-content-secondary">Errors, critical issues, destructive warnings, mandatory rules.</p>
            </div>
            <code class="text-label bg-surface-raised dark:bg-neutral-800 px-2 py-1 rounded text-content-secondary">type="error"</code>
          </div>
          <AxisCallout type="error" title="Validation Failed">
            Please fix the errors in the form before submitting.
          </AxisCallout>
        </div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- DISMISSIBLE -->
    <!-- ============================================ -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-2">Dismissible</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Add a dismiss button to allow users to close the callout. Disabled by default.
      </p>

      <div class="p-4 bg-surface-base border border-stroke rounded-lg">
        <div class="flex items-start justify-between mb-3">
          <div>
            <h3 class="text-body-regular font-medium text-content-primary">With Dismiss Button</h3>
            <p class="text-label text-content-secondary">Emits a <code class="bg-surface-raised dark:bg-neutral-800 px-1 rounded">dismiss</code> event when clicked.</p>
          </div>
          <code class="text-label bg-surface-raised dark:bg-neutral-800 px-2 py-1 rounded text-content-secondary">dismissible</code>
        </div>
        <div class="space-y-3">
          <AxisCallout v-if="showDismissDemo" dismissible @dismiss="showDismissDemo = false">
            This callout can be dismissed. Click the X button to close it.
          </AxisCallout>
          <AxisButton
            v-if="!showDismissDemo"
            variant="outlined"
            size="sm"
            @click="resetDismissDemo"
          >
            Reset Demo
          </AxisButton>
        </div>
      </div>

      <div class="mt-4 p-3 bg-alert-50 dark:bg-alert-900/30 border border-alert-200 dark:border-alert-800 rounded-lg">
        <p class="text-label text-alert-800 dark:text-alert-300">
          <strong>Best Practice:</strong> Only make callouts dismissible when the information is
          non-critical and the user has acknowledged it. Critical errors or mandatory rules should
          NOT be dismissible.
        </p>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- WITH ACTIONS -->
    <!-- ============================================ -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-2">With Actions</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Use the <code class="bg-surface-raised dark:bg-neutral-800 px-1 rounded">#actions</code> slot to add buttons or links for user actions.
      </p>

      <div class="space-y-4">
        <!-- Action buttons example -->
        <div class="p-4 bg-surface-base border border-stroke rounded-lg">
          <h3 class="text-body-regular font-medium text-content-primary mb-3">Retry Action</h3>
          <AxisCallout type="error" title="Connection Failed">
            Unable to connect to the server. Please check your connection and try again.
            <template #actions>
              <AxisButton variant="ghost" size="sm" :icon-left="ArrowPathIcon">Retry</AxisButton>
              <AxisButton variant="ghost" size="sm">Learn More</AxisButton>
            </template>
          </AxisCallout>
        </div>

        <!-- Learn more example -->
        <div class="p-4 bg-surface-base border border-stroke rounded-lg">
          <h3 class="text-body-regular font-medium text-content-primary mb-3">Learn More Link</h3>
          <AxisCallout title="New Feature Available">
            We've added bulk export functionality. You can now export multiple records at once.
            <template #actions>
              <AxisButton variant="ghost" size="sm" :icon-right="ArrowRightIcon">Learn More</AxisButton>
            </template>
          </AxisCallout>
        </div>

        <!-- Success with action -->
        <div class="p-4 bg-surface-base border border-stroke rounded-lg">
          <h3 class="text-body-regular font-medium text-content-primary mb-3">View Details</h3>
          <AxisCallout type="success" title="Report Generated">
            Your report is ready to download.
            <template #actions>
              <AxisButton variant="ghost" size="sm" :icon-left="BookOpenIcon">View Report</AxisButton>
            </template>
          </AxisCallout>
        </div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- CUSTOM ICONS -->
    <!-- ============================================ -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-2">Custom Icons</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Override the default icon or hide it entirely.
      </p>

      <div class="space-y-4">
        <!-- Custom icon -->
        <div class="p-4 bg-surface-base border border-stroke rounded-lg">
          <div class="flex items-start justify-between mb-3">
            <div>
              <h3 class="text-body-regular font-medium text-content-primary">Custom Icon</h3>
              <p class="text-label text-content-secondary">Pass any Heroicon component.</p>
            </div>
            <code class="text-label bg-surface-raised dark:bg-neutral-800 px-2 py-1 rounded text-content-secondary">:icon="BookOpenIcon"</code>
          </div>
          <AxisCallout :icon="BookOpenIcon">
            Documentation is available in the Help Center.
          </AxisCallout>
        </div>

        <!-- No icon -->
        <div class="p-4 bg-surface-base border border-stroke rounded-lg">
          <div class="flex items-start justify-between mb-3">
            <div>
              <h3 class="text-body-regular font-medium text-content-primary">No Icon</h3>
              <p class="text-label text-content-secondary">Hide the icon for minimal presentation.</p>
            </div>
            <code class="text-label bg-surface-raised dark:bg-neutral-800 px-2 py-1 rounded text-content-secondary">hide-icon</code>
          </div>
          <AxisCallout hide-icon>
            This callout has no icon, creating a cleaner look for simple messages.
          </AxisCallout>
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
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Use the appropriate type for the message context</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Keep messages concise and actionable</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Include a title for important callouts</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Provide action buttons when users can take immediate action</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Use info type for general tips and guidance</span>
            </li>
          </ul>
        </div>

        <!-- Don'ts -->
        <div>
          <h3 class="text-h5 text-error-700 dark:text-error-400 mb-3">Don't</h3>
          <ul class="space-y-2 text-body-regular text-content-secondary">
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Stack multiple callouts of the same type</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Use callouts for transient notifications (use Toast instead)</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Make critical error callouts dismissible</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Write overly long messages - be concise</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Use warning type for simple informational messages</span>
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
              <th class="py-2 text-label-bold text-neutral-700 dark:text-neutral-300">Why</th>
            </tr>
          </thead>
          <tbody class="text-body-regular text-content-secondary">
            <tr class="border-b border-stroke-subtle">
              <td class="py-3 pr-4">Page-level important notice</td>
              <td class="py-3 pr-4"><code class="text-label bg-success-100 dark:bg-success-900 px-1.5 py-0.5 rounded text-success-700 dark:text-success-300">AxisCallout</code></td>
              <td class="py-3 text-label">Persists on page, draws attention with accent bar</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-3 pr-4">Form validation error</td>
              <td class="py-3 pr-4"><code class="text-label bg-success-100 dark:bg-success-900 px-1.5 py-0.5 rounded text-success-700 dark:text-success-300">AxisCallout</code></td>
              <td class="py-3 text-label">Shows above form, summarizes validation issues</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-3 pr-4">Success after form submit</td>
              <td class="py-3 pr-4"><code class="text-label bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-700 dark:text-neutral-300">Toast</code></td>
              <td class="py-3 text-label">Transient feedback, auto-dismisses</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-3 pr-4">Feature announcement</td>
              <td class="py-3 pr-4"><code class="text-label bg-success-100 dark:bg-success-900 px-1.5 py-0.5 rounded text-success-700 dark:text-success-300">AxisCallout</code></td>
              <td class="py-3 text-label">Dismissible, provides link to learn more</td>
            </tr>
            <tr>
              <td class="py-3 pr-4">Network error</td>
              <td class="py-3 pr-4"><code class="text-label bg-success-100 dark:bg-success-900 px-1.5 py-0.5 rounded text-success-700 dark:text-success-300">AxisCallout</code></td>
              <td class="py-3 text-label">Error type with retry action</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- API REFERENCE -->
    <!-- ============================================ -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-3">API Reference</h2>

      <!-- Props -->
      <h3 class="text-body-regular font-medium text-content-primary mb-2">Props</h3>
      <div class="overflow-x-auto mb-6">
        <table class="w-full text-left">
          <thead>
            <tr class="border-b border-stroke">
              <th class="py-2 pr-4 text-label-bold text-content-secondary">Prop</th>
              <th class="py-2 pr-4 text-label-bold text-content-secondary">Type</th>
              <th class="py-2 pr-4 text-label-bold text-content-secondary">Default</th>
              <th class="py-2 text-label-bold text-neutral-700 dark:text-neutral-300">Description</th>
            </tr>
          </thead>
          <tbody class="text-body-regular text-content-secondary">
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">type</code></td>
              <td class="py-2 pr-4 text-label">'info' | 'success' | 'warning' | 'error'</td>
              <td class="py-2 pr-4 text-label">'info'</td>
              <td class="py-2 text-label">Callout type determines color scheme and default icon</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">title</code></td>
              <td class="py-2 pr-4 text-label">string</td>
              <td class="py-2 pr-4 text-label">undefined</td>
              <td class="py-2 text-label">Optional title displayed above body text</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">dismissible</code></td>
              <td class="py-2 pr-4 text-label">boolean</td>
              <td class="py-2 pr-4 text-label">false</td>
              <td class="py-2 text-label">Show dismiss (X) button</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">icon</code></td>
              <td class="py-2 pr-4 text-label">Component</td>
              <td class="py-2 pr-4 text-label">varies by type</td>
              <td class="py-2 text-label">Custom icon component (overrides default)</td>
            </tr>
            <tr>
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">hide-icon</code></td>
              <td class="py-2 pr-4 text-label">boolean</td>
              <td class="py-2 pr-4 text-label">false</td>
              <td class="py-2 text-label">Hide the icon entirely</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Events -->
      <h3 class="text-body-regular font-medium text-content-primary mb-2">Events</h3>
      <div class="overflow-x-auto mb-6">
        <table class="w-full text-left">
          <thead>
            <tr class="border-b border-stroke">
              <th class="py-2 pr-4 text-label-bold text-content-secondary">Event</th>
              <th class="py-2 pr-4 text-label-bold text-content-secondary">Payload</th>
              <th class="py-2 text-label-bold text-neutral-700 dark:text-neutral-300">Description</th>
            </tr>
          </thead>
          <tbody class="text-body-regular text-content-secondary">
            <tr>
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">dismiss</code></td>
              <td class="py-2 pr-4 text-label">none</td>
              <td class="py-2 text-label">Emitted when dismiss button is clicked</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Slots -->
      <h3 class="text-body-regular font-medium text-content-primary mb-2">Slots</h3>
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="border-b border-stroke">
              <th class="py-2 pr-4 text-label-bold text-content-secondary">Slot</th>
              <th class="py-2 text-label-bold text-neutral-700 dark:text-neutral-300">Description</th>
            </tr>
          </thead>
          <tbody class="text-body-regular text-content-secondary">
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">default</code></td>
              <td class="py-2 text-label">Main body content of the callout</td>
            </tr>
            <tr>
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">actions</code></td>
              <td class="py-2 text-label">Action buttons or links displayed below the body</td>
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
          <h3 class="text-body-regular font-medium text-info-900 dark:text-info-100 mb-2">ARIA Roles</h3>
          <ul class="text-label text-info-800 dark:text-info-300 space-y-1">
            <li><strong>Error type:</strong> Uses <code class="bg-info-100 dark:bg-info-900 px-1 rounded">role="alert"</code> for immediate announcement</li>
            <li><strong>Other types:</strong> Use <code class="bg-info-100 dark:bg-info-900 px-1 rounded">role="status"</code> for polite announcement</li>
          </ul>
        </div>

        <div class="p-4 bg-surface-raised border border-stroke rounded-lg">
          <h3 class="text-body-regular font-medium text-content-primary mb-2">Additional Attributes</h3>
          <ul class="text-label text-content-secondary space-y-1">
            <li><code class="bg-surface-raised dark:bg-neutral-700 px-1 rounded">aria-label="Dismiss"</code> - Applied to dismiss button</li>
            <li><code class="bg-surface-raised dark:bg-neutral-700 px-1 rounded">aria-hidden="true"</code> - Applied to icons and accent bar</li>
          </ul>
        </div>

        <div class="p-4 bg-success-50 dark:bg-success-950 border border-success-200 dark:border-success-800 rounded-lg">
          <h3 class="text-body-regular font-medium text-success-900 dark:text-success-100 mb-2">Color Contrast</h3>
          <p class="text-label text-success-800 dark:text-success-300">
            All text colors meet WCAG AA contrast requirements against their respective backgrounds.
            The accent bar provides additional visual distinction beyond color alone.
          </p>
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
            <span class="text-label-bold text-content-secondary">Basic Usage</span>
            <button
              class="text-label text-main-700 dark:text-main-400 hover:text-main-900 dark:hover:text-main-200"
              @click="copyToClipboard(codeExamples.basic)"
            >
              {{ copiedCode === codeExamples.basic ? 'Copied!' : 'Copy' }}
            </button>
          </div>
          <pre class="p-4 text-label bg-neutral-900 overflow-x-auto"><code class="text-neutral-100">{{ codeExamples.basic }}</code></pre>
        </div>

        <!-- With Title -->
        <div class="border border-stroke rounded-lg overflow-hidden">
          <div class="px-4 py-2 bg-surface-raised border-b border-stroke flex items-center justify-between">
            <span class="text-label-bold text-content-secondary">With Title</span>
            <button
              class="text-label text-main-700 dark:text-main-400 hover:text-main-900 dark:hover:text-main-200"
              @click="copyToClipboard(codeExamples.withTitle)"
            >
              {{ copiedCode === codeExamples.withTitle ? 'Copied!' : 'Copy' }}
            </button>
          </div>
          <pre class="p-4 text-label bg-neutral-900 overflow-x-auto"><code class="text-neutral-100">{{ codeExamples.withTitle }}</code></pre>
        </div>

        <!-- All Types -->
        <div class="border border-stroke rounded-lg overflow-hidden">
          <div class="px-4 py-2 bg-surface-raised border-b border-stroke flex items-center justify-between">
            <span class="text-label-bold text-content-secondary">All Types</span>
            <button
              class="text-label text-main-700 dark:text-main-400 hover:text-main-900 dark:hover:text-main-200"
              @click="copyToClipboard(codeExamples.types)"
            >
              {{ copiedCode === codeExamples.types ? 'Copied!' : 'Copy' }}
            </button>
          </div>
          <pre class="p-4 text-label bg-neutral-900 overflow-x-auto"><code class="text-neutral-100">{{ codeExamples.types }}</code></pre>
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

        <!-- With Actions -->
        <div class="border border-stroke rounded-lg overflow-hidden">
          <div class="px-4 py-2 bg-surface-raised border-b border-stroke flex items-center justify-between">
            <span class="text-label-bold text-content-secondary">With Actions</span>
            <button
              class="text-label text-main-700 dark:text-main-400 hover:text-main-900 dark:hover:text-main-200"
              @click="copyToClipboard(codeExamples.withActions)"
            >
              {{ copiedCode === codeExamples.withActions ? 'Copied!' : 'Copy' }}
            </button>
          </div>
          <pre class="p-4 text-label bg-neutral-900 overflow-x-auto"><code class="text-neutral-100">{{ codeExamples.withActions }}</code></pre>
        </div>
      </div>
    </div>
  </div>
</template>
