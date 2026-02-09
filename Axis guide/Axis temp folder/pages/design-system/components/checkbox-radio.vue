<script setup lang="ts">
import { CheckIcon, XMarkIcon } from "@heroicons/vue/24/outline";

definePageMeta({
  layout: "design-system",
});

useHead({
  title: "Checkbox & Radio | Components | Design System | 8020",
});

// ============================================
// CHECKBOX & RADIO SPECIFICATION - AXIS DESIGN SYSTEM
// Source of truth - NO EXCEPTIONS
// ============================================

// Demo state for checkboxes
const singleCheckbox = ref(false);
const termsAccepted = ref(false);
const newsletterOptIn = ref(true);

// Demo state for checkbox group with select all
const selectAllItems = ref(false);
const selectedItems = ref({
  item1: false,
  item2: true,
  item3: false,
});

// Computed for indeterminate state
const someItemsSelected = computed(() => {
  const values = Object.values(selectedItems.value);
  const checkedCount = values.filter(Boolean).length;
  return checkedCount > 0 && checkedCount < values.length;
});

const allItemsSelected = computed(() => {
  return Object.values(selectedItems.value).every(Boolean);
});

// Watch for select all changes
watch(selectAllItems, (newValue) => {
  selectedItems.value = {
    item1: newValue,
    item2: newValue,
    item3: newValue,
  };
});

// Watch for individual item changes
watch(
  selectedItems,
  (newValue) => {
    const allChecked = Object.values(newValue).every(Boolean);
    const noneChecked = Object.values(newValue).every((v) => !v);

    if (allChecked) {
      selectAllItems.value = true;
    } else if (noneChecked) {
      selectAllItems.value = false;
    }
    // Indeterminate handled by someItemsSelected computed
  },
  { deep: true }
);

// Demo state for radios
const paymentMethod = ref<string>("");
const shippingSpeed = ref<string>("standard");
const planSelection = ref<string>("pro");

// Demo state for error examples
const errorCheckbox = ref(false);
const errorRadio = ref<string>("");

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

// Code examples
const codeExamples = {
  basicCheckbox: `<AxisCheckbox v-model="accepted" label="I accept the terms and conditions" />`,
  checkboxWithHint: `<AxisCheckbox
  v-model="newsletter"
  label="Subscribe to newsletter"
  hint="We'll send you weekly updates about new features"
/>`,
  indeterminateCheckbox: `<AxisCheckbox
  v-model="selectAll"
  :indeterminate="someSelected && !allSelected"
  label="Select all items"
/>`,
  basicRadio: `<AxisRadio
  v-model="selected"
  value="option1"
  name="options"
  label="Option 1"
/>`,
  radioGroup: `<AxisRadioGroup
  v-model="selection"
  label="Choose a plan"
  name="plans"
>
  <AxisRadio value="free" label="Free" hint="Basic features" />
  <AxisRadio value="pro" label="Pro" hint="All features" />
  <AxisRadio value="team" label="Team" hint="Collaboration tools" />
</AxisRadioGroup>`,
};
</script>

<template>
  <div>
    <!-- Header -->
    <div class="docs-section">
      <h1 class="text-h2 text-content-primary">Checkbox & Radio</h1>
      <p class="text-body-regular text-content-secondary">
        Selection controls for single or multiple choices. Use checkboxes for multi-select, radios for mutually exclusive options.
      </p>
    </div>

    <!-- Overview -->
    <div class="docs-section-highlight">
      <h2 class="text-h4 text-content-primary mb-2">Overview</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Checkboxes and radio buttons are fundamental form controls. Checkboxes allow users to select multiple options from a list,
        while radio buttons restrict selection to a single option within a group.
      </p>
      <div class="flex flex-wrap gap-8">
        <div class="flex flex-col gap-2">
          <span class="text-label-bold text-content-secondary">Checkbox</span>
          <AxisCheckbox v-model="singleCheckbox" label="Multiple selections allowed" />
        </div>
        <div class="flex flex-col gap-2">
          <span class="text-label-bold text-content-secondary">Radio</span>
          <div class="flex gap-4">
            <AxisRadio v-model="paymentMethod" value="card" name="overview-payment" label="Card" />
            <AxisRadio v-model="paymentMethod" value="bank" name="overview-payment" label="Bank" />
          </div>
        </div>
      </div>
    </div>

    <!-- MANDATORY RULE Notice -->
    <div class="docs-section">
      <AxisCallout type="warning" title="Mandatory Rule - No Exceptions">
        All selection controls in the platform MUST use <code class="bg-alert-100 dark:bg-alert-900 px-1 rounded">AxisCheckbox</code> or
        <code class="bg-alert-100 dark:bg-alert-900 px-1 rounded">AxisRadio</code> components.
        Raw HTML checkboxes/radios or custom selection styles are <strong>strictly prohibited</strong>.
      </AxisCallout>
    </div>

    <!-- ============================================ -->
    <!-- WHEN TO USE -->
    <!-- ============================================ -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-3">When to Use</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Checkbox usage -->
        <div class="p-4 bg-surface-base border border-stroke rounded-lg">
          <h3 class="text-body-regular font-medium text-content-primary mb-3">Checkbox</h3>
          <ul class="space-y-2 text-label text-content-secondary">
            <li class="flex items-start gap-2">
              <CheckIcon class="w-4 h-4 text-success-500 mt-0.5 shrink-0" />
              <span>Multiple selections from a list</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckIcon class="w-4 h-4 text-success-500 mt-0.5 shrink-0" />
              <span>Standalone binary choice (agree/disagree)</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckIcon class="w-4 h-4 text-success-500 mt-0.5 shrink-0" />
              <span>Select all / partial selection patterns</span>
            </li>
            <li class="flex items-start gap-2">
              <XMarkIcon class="w-4 h-4 text-error-500 mt-0.5 shrink-0" />
              <span>Don't use for on/off settings (use Toggle)</span>
            </li>
          </ul>
        </div>

        <!-- Radio usage -->
        <div class="p-4 bg-surface-base border border-stroke rounded-lg">
          <h3 class="text-body-regular font-medium text-content-primary mb-3">Radio</h3>
          <ul class="space-y-2 text-label text-content-secondary">
            <li class="flex items-start gap-2">
              <CheckIcon class="w-4 h-4 text-success-500 mt-0.5 shrink-0" />
              <span>Single selection from 2-5 options</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckIcon class="w-4 h-4 text-success-500 mt-0.5 shrink-0" />
              <span>All options visible at once</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckIcon class="w-4 h-4 text-success-500 mt-0.5 shrink-0" />
              <span>Mutually exclusive choices</span>
            </li>
            <li class="flex items-start gap-2">
              <XMarkIcon class="w-4 h-4 text-error-500 mt-0.5 shrink-0" />
              <span>Don't use for 6+ options (use Select)</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- CHECKBOX VARIANTS -->
    <!-- ============================================ -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-2">Checkbox Variants</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Checkboxes support labels, hints, and indeterminate states for complex selection patterns.
      </p>

      <div class="space-y-6">
        <!-- Basic -->
        <div class="p-4 bg-surface-base border border-stroke rounded-lg">
          <div class="flex items-start justify-between mb-3">
            <div>
              <h3 class="text-body-regular font-medium text-content-primary">Basic</h3>
              <p class="text-label text-content-secondary">Simple checkbox with label text.</p>
            </div>
          </div>
          <div class="flex flex-col gap-3">
            <AxisCheckbox v-model="termsAccepted" label="I accept the terms and conditions" />
            <AxisCheckbox v-model="newsletterOptIn" label="Subscribe to our newsletter" />
          </div>
        </div>

        <!-- With Hint -->
        <div class="p-4 bg-surface-base border border-stroke rounded-lg">
          <div class="flex items-start justify-between mb-3">
            <div>
              <h3 class="text-body-regular font-medium text-content-primary">With Hint Text</h3>
              <p class="text-label text-content-secondary">Additional context below the label.</p>
            </div>
          </div>
          <div class="flex flex-col gap-3">
            <AxisCheckbox
              :model-value="true"
              label="Enable notifications"
              hint="Receive alerts when properties match your criteria"
            />
            <AxisCheckbox
              :model-value="false"
              label="Share analytics"
              hint="Help us improve by sharing anonymous usage data"
            />
          </div>
        </div>

        <!-- Indeterminate (Select All) -->
        <div class="p-4 bg-surface-base border border-stroke rounded-lg">
          <div class="flex items-start justify-between mb-3">
            <div>
              <h3 class="text-body-regular font-medium text-content-primary">Indeterminate State</h3>
              <p class="text-label text-content-secondary">Used for "select all" when some children are selected.</p>
            </div>
          </div>
          <div class="flex flex-col gap-3">
            <AxisCheckbox
              v-model="selectAllItems"
              :indeterminate="someItemsSelected"
              label="Select all items"
            />
            <div class="ml-6 flex flex-col gap-2 border-l-2 border-stroke pl-4">
              <AxisCheckbox v-model="selectedItems.item1" label="Item 1" />
              <AxisCheckbox v-model="selectedItems.item2" label="Item 2" />
              <AxisCheckbox v-model="selectedItems.item3" label="Item 3" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- RADIO VARIANTS -->
    <!-- ============================================ -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-2">Radio Variants</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Radio buttons for single selection within a group. Always group related options together.
      </p>

      <div class="space-y-6">
        <!-- Basic Horizontal -->
        <div class="p-4 bg-surface-base border border-stroke rounded-lg">
          <div class="flex items-start justify-between mb-3">
            <div>
              <h3 class="text-body-regular font-medium text-content-primary">Horizontal Layout</h3>
              <p class="text-label text-content-secondary">For 2-3 short options.</p>
            </div>
          </div>
          <div class="flex gap-6">
            <AxisRadio v-model="shippingSpeed" value="standard" name="shipping" label="Standard" />
            <AxisRadio v-model="shippingSpeed" value="express" name="shipping" label="Express" />
            <AxisRadio v-model="shippingSpeed" value="overnight" name="shipping" label="Overnight" />
          </div>
        </div>

        <!-- Vertical with Hints -->
        <div class="p-4 bg-surface-base border border-stroke rounded-lg">
          <div class="flex items-start justify-between mb-3">
            <div>
              <h3 class="text-body-regular font-medium text-content-primary">Vertical with Hints</h3>
              <p class="text-label text-content-secondary">For options needing additional context.</p>
            </div>
          </div>
          <div class="flex flex-col gap-3">
            <AxisRadio
              v-model="planSelection"
              value="free"
              name="plan"
              label="Free"
              hint="Basic features, limited to 10 properties"
            />
            <AxisRadio
              v-model="planSelection"
              value="pro"
              name="plan"
              label="Pro"
              hint="All features, unlimited properties"
            />
            <AxisRadio
              v-model="planSelection"
              value="team"
              name="plan"
              label="Team"
              hint="Pro features plus collaboration tools"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- STATES -->
    <!-- ============================================ -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-2">States</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Both checkboxes and radios support default, hover, focus, disabled, and error states.
      </p>

      <div class="space-y-6">
        <!-- Checkbox States -->
        <div class="p-4 bg-surface-base border border-stroke rounded-lg">
          <h3 class="text-body-regular font-medium text-content-primary mb-3">Checkbox States</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="flex flex-col gap-2">
              <span class="text-label text-content-tertiary">Default (Unchecked)</span>
              <AxisCheckbox :model-value="false" label="Unchecked" />
            </div>
            <div class="flex flex-col gap-2">
              <span class="text-label text-content-tertiary">Checked</span>
              <AxisCheckbox :model-value="true" label="Checked" />
            </div>
            <div class="flex flex-col gap-2">
              <span class="text-label text-content-tertiary">Disabled</span>
              <AxisCheckbox :model-value="false" label="Disabled" disabled />
              <AxisCheckbox :model-value="true" label="Disabled checked" disabled />
            </div>
            <div class="flex flex-col gap-2">
              <span class="text-label text-content-tertiary">Error</span>
              <AxisCheckbox v-model="errorCheckbox" label="Required field" error="This field is required" />
            </div>
          </div>
        </div>

        <!-- Radio States -->
        <div class="p-4 bg-surface-base border border-stroke rounded-lg">
          <h3 class="text-body-regular font-medium text-content-primary mb-3">Radio States</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="flex flex-col gap-2">
              <span class="text-label text-content-tertiary">Default</span>
              <AxisRadio :model-value="''" value="a" name="state-default" label="Unselected" />
            </div>
            <div class="flex flex-col gap-2">
              <span class="text-label text-content-tertiary">Selected</span>
              <AxisRadio :model-value="'b'" value="b" name="state-selected" label="Selected" />
            </div>
            <div class="flex flex-col gap-2">
              <span class="text-label text-content-tertiary">Disabled</span>
              <AxisRadio :model-value="''" value="c" name="state-disabled" label="Disabled" disabled />
              <AxisRadio :model-value="'d'" value="d" name="state-disabled-sel" label="Disabled selected" disabled />
            </div>
            <div class="flex flex-col gap-2">
              <span class="text-label text-content-tertiary">Error</span>
              <AxisRadio v-model="errorRadio" value="e" name="state-error" label="Required" error="Please select an option" />
            </div>
          </div>
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
              <span>Use clear, concise labels that describe the option</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Group related options with fieldset and legend</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Provide a default selection for radios when appropriate</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Use indeterminate state for parent "select all" checkboxes</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Order options logically (alphabetically, by frequency, etc.)</span>
            </li>
          </ul>
        </div>

        <!-- Don'ts -->
        <div>
          <h3 class="text-h5 text-error-700 dark:text-error-400 mb-3">Don't</h3>
          <ul class="space-y-2 text-body-regular text-content-secondary">
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Use radios for more than 5 options (use Select instead)</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Mix checkboxes and radios in the same group</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Use checkboxes for on/off settings (use Toggle instead)</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Pre-select options that could have legal implications</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Use negative language ("Don't send me emails")</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- API REFERENCE - CHECKBOX -->
    <!-- ============================================ -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-3">API Reference - AxisCheckbox</h2>

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
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">v-model</code></td>
              <td class="py-2 pr-4 text-label">boolean</td>
              <td class="py-2 pr-4 text-label">false</td>
              <td class="py-2 text-label">Checkbox checked state</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">label</code></td>
              <td class="py-2 pr-4 text-label">string</td>
              <td class="py-2 pr-4 text-label">''</td>
              <td class="py-2 text-label">Label text displayed next to checkbox</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">hint</code></td>
              <td class="py-2 pr-4 text-label">string</td>
              <td class="py-2 pr-4 text-label">''</td>
              <td class="py-2 text-label">Helper text below label</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">error</code></td>
              <td class="py-2 pr-4 text-label">string</td>
              <td class="py-2 pr-4 text-label">''</td>
              <td class="py-2 text-label">Error message (also sets error state)</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">disabled</code></td>
              <td class="py-2 pr-4 text-label">boolean</td>
              <td class="py-2 pr-4 text-label">false</td>
              <td class="py-2 text-label">Disable checkbox interaction</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">indeterminate</code></td>
              <td class="py-2 pr-4 text-label">boolean</td>
              <td class="py-2 pr-4 text-label">false</td>
              <td class="py-2 text-label">Show indeterminate state (partial selection)</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">required</code></td>
              <td class="py-2 pr-4 text-label">boolean</td>
              <td class="py-2 pr-4 text-label">false</td>
              <td class="py-2 text-label">Mark as required field</td>
            </tr>
            <tr>
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">name</code></td>
              <td class="py-2 pr-4 text-label">string</td>
              <td class="py-2 pr-4 text-label">''</td>
              <td class="py-2 text-label">HTML input name attribute</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- API REFERENCE - RADIO -->
    <!-- ============================================ -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-3">API Reference - AxisRadio</h2>

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
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">v-model</code></td>
              <td class="py-2 pr-4 text-label">string | number | boolean</td>
              <td class="py-2 pr-4 text-label">undefined</td>
              <td class="py-2 text-label">Selected value in radio group</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">value</code></td>
              <td class="py-2 pr-4 text-label">string | number | boolean</td>
              <td class="py-2 pr-4 text-label"><strong>required</strong></td>
              <td class="py-2 text-label">Value of this radio option</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">name</code></td>
              <td class="py-2 pr-4 text-label">string</td>
              <td class="py-2 pr-4 text-label"><strong>required</strong></td>
              <td class="py-2 text-label">Group name (must be same for all radios in group)</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">label</code></td>
              <td class="py-2 pr-4 text-label">string</td>
              <td class="py-2 pr-4 text-label">''</td>
              <td class="py-2 text-label">Label text displayed next to radio</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">hint</code></td>
              <td class="py-2 pr-4 text-label">string</td>
              <td class="py-2 pr-4 text-label">''</td>
              <td class="py-2 text-label">Helper text below label</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">error</code></td>
              <td class="py-2 pr-4 text-label">string</td>
              <td class="py-2 pr-4 text-label">''</td>
              <td class="py-2 text-label">Error message (also sets error state)</td>
            </tr>
            <tr>
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">disabled</code></td>
              <td class="py-2 pr-4 text-label">boolean</td>
              <td class="py-2 pr-4 text-label">false</td>
              <td class="py-2 text-label">Disable radio interaction</td>
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
          <h3 class="text-body-regular font-medium text-info-900 dark:text-info-100 mb-2">Keyboard Navigation</h3>
          <ul class="text-label text-info-800 dark:text-info-300 space-y-1">
            <li><strong>Tab:</strong> Move focus to checkbox/radio group</li>
            <li><strong>Space:</strong> Toggle checkbox or select radio</li>
            <li><strong>Arrow Keys:</strong> Navigate between radios in a group</li>
            <li><strong>Focus ring:</strong> Visible focus indicator for keyboard users</li>
          </ul>
        </div>

        <div class="p-4 bg-surface-raised border border-stroke rounded-lg">
          <h3 class="text-body-regular font-medium text-content-primary mb-2">ARIA Attributes</h3>
          <ul class="text-label text-content-secondary space-y-1">
            <li><code class="bg-surface-raised dark:bg-neutral-700 px-1 rounded">aria-checked</code> - Current checked state ("true", "false", or "mixed" for indeterminate)</li>
            <li><code class="bg-surface-raised dark:bg-neutral-700 px-1 rounded">aria-describedby</code> - Links to hint/error messages</li>
            <li><code class="bg-surface-raised dark:bg-neutral-700 px-1 rounded">aria-invalid</code> - Set when in error state</li>
            <li><code class="bg-surface-raised dark:bg-neutral-700 px-1 rounded">aria-required</code> - Indicates required field</li>
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
        <!-- Basic Checkbox -->
        <div class="border border-stroke rounded-lg overflow-hidden">
          <div class="px-4 py-2 bg-surface-raised border-b border-stroke flex items-center justify-between">
            <span class="text-label-bold text-content-secondary">Basic Checkbox</span>
            <button
              class="text-label text-main-700 dark:text-main-400 hover:text-main-900 dark:hover:text-main-200"
              @click="copyToClipboard(codeExamples.basicCheckbox)"
            >
              {{ copiedCode === codeExamples.basicCheckbox ? 'Copied!' : 'Copy' }}
            </button>
          </div>
          <pre class="p-4 text-label bg-neutral-900 overflow-x-auto"><code class="text-neutral-100">{{ codeExamples.basicCheckbox }}</code></pre>
        </div>

        <!-- Checkbox with Hint -->
        <div class="border border-stroke rounded-lg overflow-hidden">
          <div class="px-4 py-2 bg-surface-raised border-b border-stroke flex items-center justify-between">
            <span class="text-label-bold text-content-secondary">Checkbox with Hint</span>
            <button
              class="text-label text-main-700 dark:text-main-400 hover:text-main-900 dark:hover:text-main-200"
              @click="copyToClipboard(codeExamples.checkboxWithHint)"
            >
              {{ copiedCode === codeExamples.checkboxWithHint ? 'Copied!' : 'Copy' }}
            </button>
          </div>
          <pre class="p-4 text-label bg-neutral-900 overflow-x-auto"><code class="text-neutral-100">{{ codeExamples.checkboxWithHint }}</code></pre>
        </div>

        <!-- Indeterminate Checkbox -->
        <div class="border border-stroke rounded-lg overflow-hidden">
          <div class="px-4 py-2 bg-surface-raised border-b border-stroke flex items-center justify-between">
            <span class="text-label-bold text-content-secondary">Indeterminate (Select All)</span>
            <button
              class="text-label text-main-700 dark:text-main-400 hover:text-main-900 dark:hover:text-main-200"
              @click="copyToClipboard(codeExamples.indeterminateCheckbox)"
            >
              {{ copiedCode === codeExamples.indeterminateCheckbox ? 'Copied!' : 'Copy' }}
            </button>
          </div>
          <pre class="p-4 text-label bg-neutral-900 overflow-x-auto"><code class="text-neutral-100">{{ codeExamples.indeterminateCheckbox }}</code></pre>
        </div>

        <!-- Basic Radio -->
        <div class="border border-stroke rounded-lg overflow-hidden">
          <div class="px-4 py-2 bg-surface-raised border-b border-stroke flex items-center justify-between">
            <span class="text-label-bold text-content-secondary">Basic Radio</span>
            <button
              class="text-label text-main-700 dark:text-main-400 hover:text-main-900 dark:hover:text-main-200"
              @click="copyToClipboard(codeExamples.basicRadio)"
            >
              {{ copiedCode === codeExamples.basicRadio ? 'Copied!' : 'Copy' }}
            </button>
          </div>
          <pre class="p-4 text-label bg-neutral-900 overflow-x-auto"><code class="text-neutral-100">{{ codeExamples.basicRadio }}</code></pre>
        </div>

        <!-- Radio Group -->
        <div class="border border-stroke rounded-lg overflow-hidden">
          <div class="px-4 py-2 bg-surface-raised border-b border-stroke flex items-center justify-between">
            <span class="text-label-bold text-content-secondary">Radio Group</span>
            <button
              class="text-label text-main-700 dark:text-main-400 hover:text-main-900 dark:hover:text-main-200"
              @click="copyToClipboard(codeExamples.radioGroup)"
            >
              {{ copiedCode === codeExamples.radioGroup ? 'Copied!' : 'Copy' }}
            </button>
          </div>
          <pre class="p-4 text-label bg-neutral-900 overflow-x-auto"><code class="text-neutral-100">{{ codeExamples.radioGroup }}</code></pre>
        </div>
      </div>
    </div>
  </div>
</template>
