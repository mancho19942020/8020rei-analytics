<script setup lang="ts">
import {
  PlusIcon,
  ArrowRightIcon,
  TrashIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
} from "@heroicons/vue/24/outline";

definePageMeta({
  layout: "design-system",
});

useHead({
  title: "Buttons | Components | Design System | 8020",
});

// ============================================
// BUTTON SPECIFICATION - AXIS DESIGN SYSTEM
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

// Demo loading state
const isLoading = ref(false);
const startLoading = () => {
  isLoading.value = true;
  setTimeout(() => {
    isLoading.value = false;
  }, 2000);
};

// Code examples as strings to avoid Vue parsing issues
const codeExamples = {
  basic: "<AxisButton>Save Changes</AxisButton>",
  withIcons: ["<scr", "ipt setup>"].join("") + `
import { PlusIcon } from '@heroicons/vue/24/outline'
` + ["</scr", "ipt>"].join("") + `

` + ["<temp", "late>"].join("") + `
  <AxisButton :icon-left="PlusIcon">Add Item</AxisButton>
` + ["</temp", "late>"].join(""),
  loading: ["<scr", "ipt setup>"].join("") + `
const isLoading = ref(false)

const handleSubmit = async () => {
  isLoading.value = true
  await submitForm()
  isLoading.value = false
}
` + ["</scr", "ipt>"].join("") + `

` + ["<temp", "late>"].join("") + `
  <AxisButton :loading="isLoading" @click="handleSubmit">
    {{ isLoading ? 'Saving...' : 'Save' }}
  </AxisButton>
` + ["</temp", "late>"].join(""),
};
</script>

<template>
  <div>
    <!-- Header -->
    <div class="docs-page-header">
      <h1 class="docs-page-title">Buttons</h1>
      <p class="docs-page-description">
        Interactive elements that trigger actions. Use the right variant and size for the context.
      </p>
    </div>

    <!-- Overview -->
    <div class="docs-section-highlight">
      <h2 class="docs-section-title">Overview</h2>
      <p class="text-body-regular text-content-secondary mb-3">
        Buttons communicate actions users can take. They are typically placed in dialogs, forms, cards, and toolbars.
        Choose the appropriate variant based on the action's importance and context.
      </p>
      <div class="flex flex-wrap gap-3">
        <AxisButton>Primary Action</AxisButton>
        <AxisButton variant="outlined">Secondary Action</AxisButton>
        <AxisButton variant="ghost">Tertiary Action</AxisButton>
      </div>
    </div>

    <!-- MANDATORY RULE Notice -->
    <div class="docs-section">
      <AxisCallout type="warning" title="Mandatory Rule - No Exceptions">
        All buttons in the platform MUST use the <code class="bg-alert-100 dark:bg-alert-900 px-1 rounded">AxisButton</code> component.
        Raw HTML buttons or custom button styles are <strong>strictly prohibited</strong>.
      </AxisCallout>
    </div>

    <!-- ============================================ -->
    <!-- VARIANTS -->
    <!-- ============================================ -->
    <div class="docs-section">
      <h2 class="docs-section-title">Variants</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Three variants to establish visual hierarchy. Use filled for primary actions, outlined for secondary, and ghost for tertiary.
      </p>

      <div class="space-y-6">
        <!-- Filled -->
        <div class="p-4 bg-surface-base border border-stroke rounded-lg">
          <div class="flex items-start justify-between mb-3">
            <div>
              <h3 class="text-body-regular font-medium text-content-primary">Filled (Default)</h3>
              <p class="text-label text-content-secondary">Primary actions, main CTAs. Highest visual prominence.</p>
            </div>
            <code class="text-label bg-surface-raised dark:bg-neutral-800 px-2 py-1 rounded text-content-secondary">variant="filled"</code>
          </div>
          <div class="flex flex-wrap gap-3">
            <AxisButton>Default</AxisButton>
            <AxisButton disabled>Disabled</AxisButton>
          </div>
        </div>

        <!-- Outlined -->
        <div class="p-4 bg-surface-base border border-stroke rounded-lg">
          <div class="flex items-start justify-between mb-3">
            <div>
              <h3 class="text-body-regular font-medium text-content-primary">Outlined</h3>
              <p class="text-label text-content-secondary">Secondary actions, alternatives to primary. Medium visual prominence.</p>
            </div>
            <code class="text-label bg-surface-raised dark:bg-neutral-800 px-2 py-1 rounded text-content-secondary">variant="outlined"</code>
          </div>
          <div class="flex flex-wrap gap-3">
            <AxisButton variant="outlined">Default</AxisButton>
            <AxisButton variant="outlined" disabled>Disabled</AxisButton>
          </div>
        </div>

        <!-- Ghost -->
        <div class="p-4 bg-surface-base border border-stroke rounded-lg">
          <div class="flex items-start justify-between mb-3">
            <div>
              <h3 class="text-body-regular font-medium text-content-primary">Ghost</h3>
              <p class="text-label text-content-secondary">Tertiary actions, inline links, low-emphasis options. Lowest visual prominence.</p>
            </div>
            <code class="text-label bg-surface-raised dark:bg-neutral-800 px-2 py-1 rounded text-content-secondary">variant="ghost"</code>
          </div>
          <div class="flex flex-wrap gap-3">
            <AxisButton variant="ghost">Default</AxisButton>
            <AxisButton variant="ghost" disabled>Disabled</AxisButton>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- SIZES -->
    <!-- ============================================ -->
    <div class="docs-section">
      <h2 class="docs-section-title">Sizes</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Three sizes for different contexts. Use medium (default) for most cases.
      </p>

      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="border-b border-stroke">
              <th class="py-2 pr-4 text-label-bold text-content-secondary">Size</th>
              <th class="py-2 pr-4 text-label-bold text-content-secondary">Height</th>
              <th class="py-2 pr-4 text-label-bold text-content-secondary">Text Size</th>
              <th class="py-2 pr-4 text-label-bold text-content-secondary">Usage</th>
              <th class="py-2 text-label-bold text-neutral-700 dark:text-neutral-300">Example</th>
            </tr>
          </thead>
          <tbody class="text-body-regular text-content-secondary">
            <tr class="border-b border-stroke-subtle">
              <td class="py-3 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">sm</code></td>
              <td class="py-3 pr-4">28px</td>
              <td class="py-3 pr-4">12px</td>
              <td class="py-3 pr-4">Compact spaces, tables, inline actions</td>
              <td class="py-3"><AxisButton size="sm">Small</AxisButton></td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-3 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">md</code></td>
              <td class="py-3 pr-4">36px</td>
              <td class="py-3 pr-4">14px</td>
              <td class="py-3 pr-4">Standard use, forms, dialogs</td>
              <td class="py-3"><AxisButton size="md">Medium</AxisButton></td>
            </tr>
            <tr>
              <td class="py-3 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">lg</code></td>
              <td class="py-3 pr-4">44px</td>
              <td class="py-3 pr-4">16px</td>
              <td class="py-3 pr-4">Prominent CTAs, hero sections, marketing</td>
              <td class="py-3"><AxisButton size="lg">Large</AxisButton></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- DESTRUCTIVE ACTIONS -->
    <!-- ============================================ -->
    <div class="docs-section">
      <h2 class="docs-section-title">Destructive Actions</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Use the <code class="bg-surface-raised dark:bg-neutral-800 px-1 rounded">destructive</code> prop for actions that delete, remove, or have irreversible consequences.
      </p>

      <div class="flex flex-wrap gap-3 mb-4">
        <AxisButton destructive>Delete</AxisButton>
        <AxisButton destructive variant="outlined">Remove</AxisButton>
        <AxisButton destructive variant="ghost">Cancel</AxisButton>
      </div>

      <AxisCallout type="warning" hide-icon>
        <strong>Best Practice:</strong> Always confirm destructive actions with a dialog or require additional user input before executing.
      </AxisCallout>
    </div>

    <!-- ============================================ -->
    <!-- ICONS -->
    <!-- ============================================ -->
    <div class="docs-section">
      <h2 class="docs-section-title">Icons</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Icons can be added to the left or right of the label, or used alone for icon-only buttons.
      </p>

      <div class="space-y-6">
        <!-- Icon Left -->
        <div>
          <h3 class="text-body-regular font-medium text-content-primary mb-2">Icon Left</h3>
          <p class="text-label text-content-secondary mb-3">Use for add, create, or action-oriented buttons.</p>
          <div class="flex flex-wrap gap-3">
            <AxisButton :icon-left="PlusIcon">Add Item</AxisButton>
            <AxisButton variant="outlined" :icon-left="PencilIcon">Edit</AxisButton>
            <AxisButton variant="ghost" :icon-left="ArrowDownTrayIcon">Download</AxisButton>
          </div>
        </div>

        <!-- Icon Right -->
        <div>
          <h3 class="text-body-regular font-medium text-content-primary mb-2">Icon Right</h3>
          <p class="text-label text-content-secondary mb-3">Use for navigation, continuation, or directional actions.</p>
          <div class="flex flex-wrap gap-3">
            <AxisButton :icon-right="ArrowRightIcon">Continue</AxisButton>
            <AxisButton variant="outlined" :icon-right="ArrowUpTrayIcon">Upload</AxisButton>
          </div>
        </div>

        <!-- Icon Both -->
        <div>
          <h3 class="text-body-regular font-medium text-content-primary mb-2">Both Icons</h3>
          <p class="text-label text-content-secondary mb-3">Use sparingly for special cases.</p>
          <div class="flex flex-wrap gap-3">
            <AxisButton :icon-left="CheckIcon" :icon-right="ArrowRightIcon">Confirm & Continue</AxisButton>
          </div>
        </div>

        <!-- Icon Only -->
        <div>
          <h3 class="text-body-regular font-medium text-content-primary mb-2">Icon Only</h3>
          <p class="text-label text-content-secondary mb-3">For compact UI elements. Always provide accessible labels via aria-label.</p>
          <div class="flex flex-wrap gap-3">
            <AxisButton :icon-left="PlusIcon" icon-only aria-label="Add" />
            <AxisButton :icon-left="PencilIcon" icon-only variant="outlined" aria-label="Edit" />
            <AxisButton :icon-left="TrashIcon" icon-only variant="ghost" destructive aria-label="Delete" />
            <AxisButton :icon-left="XMarkIcon" icon-only variant="ghost" aria-label="Close" />
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- STATES -->
    <!-- ============================================ -->
    <div class="docs-section">
      <h2 class="docs-section-title">States</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Buttons have multiple interactive states to provide feedback.
      </p>

      <div class="space-y-4">
        <!-- Loading -->
        <div class="p-4 bg-surface-base border border-stroke rounded-lg">
          <div class="flex items-start justify-between mb-3">
            <div>
              <h3 class="text-body-regular font-medium text-content-primary">Loading</h3>
              <p class="text-label text-content-secondary">Shows a spinner and disables interaction during async operations.</p>
            </div>
            <code class="text-label bg-surface-raised dark:bg-neutral-800 px-2 py-1 rounded text-content-secondary">:loading="true"</code>
          </div>
          <div class="flex flex-wrap gap-3">
            <AxisButton :loading="isLoading" @click="startLoading">
              {{ isLoading ? 'Processing...' : 'Click to Load' }}
            </AxisButton>
            <AxisButton :loading="true" variant="outlined">Loading...</AxisButton>
            <AxisButton :loading="true" variant="ghost">Loading...</AxisButton>
          </div>
        </div>

        <!-- Disabled -->
        <div class="p-4 bg-surface-base border border-stroke rounded-lg">
          <div class="flex items-start justify-between mb-3">
            <div>
              <h3 class="text-body-regular font-medium text-content-primary">Disabled</h3>
              <p class="text-label text-content-secondary">Prevents interaction. Use when action is not currently available.</p>
            </div>
            <code class="text-label bg-surface-raised dark:bg-neutral-800 px-2 py-1 rounded text-content-secondary">:disabled="true"</code>
          </div>
          <div class="flex flex-wrap gap-3">
            <AxisButton disabled>Disabled</AxisButton>
            <AxisButton variant="outlined" disabled>Disabled</AxisButton>
            <AxisButton variant="ghost" disabled>Disabled</AxisButton>
          </div>
        </div>

        <!-- Full Width -->
        <div class="p-4 bg-surface-base border border-stroke rounded-lg">
          <div class="flex items-start justify-between mb-3">
            <div>
              <h3 class="text-body-regular font-medium text-content-primary">Full Width</h3>
              <p class="text-label text-content-secondary">Expands to fill container width. Use in forms, modals, or mobile layouts.</p>
            </div>
            <code class="text-label bg-surface-raised dark:bg-neutral-800 px-2 py-1 rounded text-content-secondary">:full-width="true"</code>
          </div>
          <div class="space-y-2 max-w-md">
            <AxisButton full-width>Full Width Button</AxisButton>
            <AxisButton variant="outlined" full-width>Full Width Outlined</AxisButton>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- USAGE GUIDELINES -->
    <!-- ============================================ -->
    <div class="docs-section">
      <h2 class="docs-section-title">Usage Guidelines</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Do's -->
        <div>
          <h3 class="text-h5 text-success-700 dark:text-success-400 mb-3">Do</h3>
          <ul class="space-y-2 text-body-regular text-content-secondary">
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Use clear, action-oriented labels (Save, Submit, Delete)</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Maintain visual hierarchy with variant selection</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Use loading state for async operations</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Provide accessible labels for icon-only buttons</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Use destructive variant for irreversible actions</span>
            </li>
          </ul>
        </div>

        <!-- Don'ts -->
        <div>
          <h3 class="text-h5 text-error-700 dark:text-error-400 mb-3">Don't</h3>
          <ul class="space-y-2 text-body-regular text-content-secondary">
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Use vague labels (Click Here, Submit)</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Mix button styles inconsistently</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Disable buttons without explanation</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Use multiple primary buttons in one view</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Create custom button styles outside this system</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- API REFERENCE -->
    <!-- ============================================ -->
    <div class="docs-section">
      <h2 class="docs-section-title">API Reference</h2>

      <div class="overflow-x-auto">
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
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">variant</code></td>
              <td class="py-2 pr-4 text-label">'filled' | 'outlined' | 'ghost'</td>
              <td class="py-2 pr-4 text-label">'filled'</td>
              <td class="py-2 text-label">Visual style of the button</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">size</code></td>
              <td class="py-2 pr-4 text-label">'sm' | 'md' | 'lg'</td>
              <td class="py-2 pr-4 text-label">'md'</td>
              <td class="py-2 text-label">Size of the button</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">destructive</code></td>
              <td class="py-2 pr-4 text-label">boolean</td>
              <td class="py-2 pr-4 text-label">false</td>
              <td class="py-2 text-label">Use red color scheme for destructive actions</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">disabled</code></td>
              <td class="py-2 pr-4 text-label">boolean</td>
              <td class="py-2 pr-4 text-label">false</td>
              <td class="py-2 text-label">Disable the button</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">loading</code></td>
              <td class="py-2 pr-4 text-label">boolean</td>
              <td class="py-2 pr-4 text-label">false</td>
              <td class="py-2 text-label">Show loading spinner</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">icon-left</code></td>
              <td class="py-2 pr-4 text-label">Component</td>
              <td class="py-2 pr-4 text-label">null</td>
              <td class="py-2 text-label">Icon component for left side</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">icon-right</code></td>
              <td class="py-2 pr-4 text-label">Component</td>
              <td class="py-2 pr-4 text-label">null</td>
              <td class="py-2 text-label">Icon component for right side</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">icon-only</code></td>
              <td class="py-2 pr-4 text-label">boolean</td>
              <td class="py-2 pr-4 text-label">false</td>
              <td class="py-2 text-label">Render as icon-only button</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">full-width</code></td>
              <td class="py-2 pr-4 text-label">boolean</td>
              <td class="py-2 pr-4 text-label">false</td>
              <td class="py-2 text-label">Expand to container width</td>
            </tr>
            <tr>
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">type</code></td>
              <td class="py-2 pr-4 text-label">'button' | 'submit' | 'reset'</td>
              <td class="py-2 pr-4 text-label">'button'</td>
              <td class="py-2 text-label">HTML button type attribute</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- ACCESSIBILITY -->
    <!-- ============================================ -->
    <div class="docs-section">
      <h2 class="docs-section-title">Accessibility</h2>

      <div class="space-y-4">
        <div class="p-4 bg-info-50 dark:bg-info-950 border border-info-200 dark:border-info-800 rounded-lg">
          <h3 class="text-body-regular font-medium text-info-900 dark:text-info-100 mb-2">Keyboard Navigation</h3>
          <ul class="text-label text-info-800 dark:text-info-300 space-y-1">
            <li><strong>Tab:</strong> Move focus to the button</li>
            <li><strong>Enter/Space:</strong> Activate the button</li>
            <li><strong>Focus ring:</strong> Visible focus indicator for keyboard users</li>
          </ul>
        </div>

        <div class="p-4 bg-surface-raised border border-stroke rounded-lg">
          <h3 class="text-body-regular font-medium text-content-primary mb-2">ARIA Attributes</h3>
          <ul class="text-label text-content-secondary space-y-1">
            <li><code class="bg-surface-raised dark:bg-neutral-700 px-1 rounded">aria-disabled</code> - Set when loading</li>
            <li><code class="bg-surface-raised dark:bg-neutral-700 px-1 rounded">aria-busy</code> - Set when loading</li>
            <li><code class="bg-surface-raised dark:bg-neutral-700 px-1 rounded">aria-hidden</code> - Applied to icons</li>
            <li><code class="bg-surface-raised dark:bg-neutral-700 px-1 rounded">aria-label</code> - Required for icon-only buttons</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- CODE EXAMPLES -->
    <!-- ============================================ -->
    <div class="docs-section-last">
      <h2 class="docs-section-title">Code Examples</h2>

      <div class="space-y-4">
        <!-- Basic -->
        <div class="border border-stroke rounded-lg overflow-hidden">
          <div class="px-4 py-2 bg-surface-raised border-b border-stroke flex items-center justify-between">
            <span class="text-label-bold text-content-secondary">Basic Usage</span>
            <button
              class="text-label text-main-700 dark:text-main-400 hover:text-main-900 dark:hover:text-main-300"
              @click="copyToClipboard(codeExamples.basic)"
            >
              {{ copiedCode === codeExamples.basic ? 'Copied!' : 'Copy' }}
            </button>
          </div>
          <pre class="p-4 text-label bg-neutral-900 overflow-x-auto"><code class="text-neutral-100">{{ codeExamples.basic }}</code></pre>
        </div>

        <!-- With Icons -->
        <div class="border border-stroke rounded-lg overflow-hidden">
          <div class="px-4 py-2 bg-surface-raised border-b border-stroke flex items-center justify-between">
            <span class="text-label-bold text-content-secondary">With Icons</span>
            <button
              class="text-label text-main-700 dark:text-main-400 hover:text-main-900 dark:hover:text-main-300"
              @click="copyToClipboard(codeExamples.withIcons)"
            >
              {{ copiedCode === codeExamples.withIcons ? 'Copied!' : 'Copy' }}
            </button>
          </div>
          <pre class="p-4 text-label bg-neutral-900 overflow-x-auto"><code class="text-neutral-100">{{ codeExamples.withIcons }}</code></pre>
        </div>

        <!-- Loading State -->
        <div class="border border-stroke rounded-lg overflow-hidden">
          <div class="px-4 py-2 bg-surface-raised border-b border-stroke flex items-center justify-between">
            <span class="text-label-bold text-content-secondary">Loading State</span>
            <button
              class="text-label text-main-700 dark:text-main-400 hover:text-main-900 dark:hover:text-main-300"
              @click="copyToClipboard(codeExamples.loading)"
            >
              {{ copiedCode === codeExamples.loading ? 'Copied!' : 'Copy' }}
            </button>
          </div>
          <pre class="p-4 text-label bg-neutral-900 overflow-x-auto"><code class="text-neutral-100">{{ codeExamples.loading }}</code></pre>
        </div>
      </div>
    </div>
  </div>
</template>
