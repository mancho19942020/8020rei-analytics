<script setup lang="ts">
import {
  HomeIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  UserGroupIcon,
  TagIcon,
  FunnelIcon,
  AdjustmentsHorizontalIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/vue/24/outline";

definePageMeta({
  layout: "design-system",
});

useHead({
  title: "Select | Components | Design System | 8020",
});

// ============================================
// SELECT SPECIFICATION - AXIS DESIGN SYSTEM
// Source of truth - NO EXCEPTIONS
// ============================================

// Demo data - Property types
const propertyTypes = [
  { value: "single-family", label: "Single Family" },
  { value: "multi-family", label: "Multi-Family" },
  { value: "condo", label: "Condominium" },
  { value: "townhouse", label: "Townhouse" },
  { value: "land", label: "Land/Lot" },
  { value: "commercial", label: "Commercial" },
];

// Demo data - States
const states = [
  { value: "CA", label: "California" },
  { value: "TX", label: "Texas" },
  { value: "FL", label: "Florida" },
  { value: "NY", label: "New York" },
  { value: "AZ", label: "Arizona" },
  { value: "NV", label: "Nevada" },
  { value: "CO", label: "Colorado" },
  { value: "WA", label: "Washington" },
];

// Demo data - With icons
const propertyTypesWithIcons = [
  { value: "single-family", label: "Single Family", icon: HomeIcon },
  { value: "multi-family", label: "Multi-Family", icon: BuildingOfficeIcon },
  { value: "commercial", label: "Commercial", icon: BuildingOfficeIcon },
];

// Demo data - With disabled
const optionsWithDisabled = [
  { value: "option1", label: "Available Option" },
  { value: "option2", label: "Another Available" },
  { value: "option3", label: "Disabled Option", disabled: true },
  { value: "option4", label: "Also Available" },
];

// Demo data - Tags for multi-select
const tagOptions = [
  { value: "hot", label: "Hot Lead" },
  { value: "new", label: "New Listing" },
  { value: "price-reduced", label: "Price Reduced" },
  { value: "foreclosure", label: "Foreclosure" },
  { value: "short-sale", label: "Short Sale" },
  { value: "reo", label: "REO" },
];

// Demo values
const singleValue = ref<string | null>(null);
const singleValueFilled = ref<string | null>("single-family");
const multipleValues = ref<string[]>([]);
const multipleValuesFilled = ref<string[]>(["hot", "new"]);
const searchableValue = ref<string | null>(null);
const stateValue = ref<string | null>(null);
const iconValue = ref<string | null>(null);
const errorValue = ref<string | null>(null);
const ghostValue = ref<string | null>(null);

// Validation demo
const requiredValue = ref<string | null>(null);
const requiredError = ref("");
const validateRequired = () => {
  if (!requiredValue.value) {
    requiredError.value = "Please select an option";
  } else {
    requiredError.value = "";
  }
};

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
  basic: `<AxisSelect
  v-model="propertyType"
  :options="propertyTypes"
  label="Property Type"
  placeholder="Select type"
/>`,
  multiple: `<AxisSelect
  v-model="selectedTags"
  :options="tagOptions"
  label="Tags"
  placeholder="Select tags"
  multiple
/>`,
  searchable: `<AxisSelect
  v-model="state"
  :options="states"
  label="State"
  placeholder="Search states..."
  searchable
/>`,
  withIcons: `const propertyTypes = [
  { value: 'single-family', label: 'Single Family', icon: HomeIcon },
  { value: 'multi-family', label: 'Multi-Family', icon: BuildingOfficeIcon },
]

<AxisSelect
  v-model="propertyType"
  :options="propertyTypes"
  label="Property Type"
/>`,
  validation: `const value = ref(null)
const error = ref('')

const validate = () => {
  if (!value.value) {
    error.value = 'This field is required'
  } else {
    error.value = ''
  }
}

<AxisSelect
  v-model="value"
  :options="options"
  label="Required Field"
  :error="error"
  required
  @blur="validate"
/>`,
};
</script>

<template>
  <div>
    <!-- Header -->
    <div class="docs-section">
      <h1 class="text-h2 text-content-primary">Select</h1>
      <p class="text-body-regular text-content-secondary">
        Select components allow users to choose one or more options from a list. They are used when there are multiple options to choose from and the space is limited.
      </p>
    </div>

    <!-- Overview -->
    <div class="docs-section-highlight">
      <h2 class="text-h4 text-content-primary mb-2">Overview</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        The select component is used to capture user input from a list of options. It's ideal when you have a predefined list of options and want to save space compared to radio buttons or checkboxes.
      </p>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl">
        <AxisSelect
          v-model="singleValue"
          :options="propertyTypes"
          label="Property Type"
          placeholder="Select type"
        />
        <AxisSelect
          v-model="multipleValues"
          :options="tagOptions"
          label="Tags"
          placeholder="Select tags"
          multiple
        />
        <AxisSelect
          v-model="searchableValue"
          :options="states"
          label="State"
          placeholder="Search..."
          searchable
        />
      </div>
    </div>

    <!-- MANDATORY RULE Notice -->
    <div class="docs-section">
      <AxisCallout type="warning" title="Mandatory Rule - No Exceptions">
        All select/dropdown inputs in the platform MUST use the <code class="bg-alert-100 dark:bg-alert-900 px-1 rounded">AxisSelect</code> component.
        Raw HTML select elements or custom dropdown styles are <strong>strictly prohibited</strong>.
      </AxisCallout>
    </div>

    <!-- ============================================ -->
    <!-- WHEN TO USE -->
    <!-- ============================================ -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-3">When to Use</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
        <div>
          <h3 class="text-h5 text-success-700 dark:text-success-400 mb-3">Use Select When</h3>
          <ul class="space-y-2 text-body-regular text-content-secondary">
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>You have 4+ options to choose from</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Screen space is limited</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Users need to select from a predefined list</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>The options are mutually exclusive (single select)</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Users need to select multiple items from a list</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>You want a searchable list of options</span>
            </li>
          </ul>
        </div>

        <div>
          <h3 class="text-h5 text-error-700 dark:text-error-400 mb-3">Don't Use Select When</h3>
          <ul class="space-y-2 text-body-regular text-content-secondary">
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>You have fewer than 4 options (use radio buttons)</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Options need to be visible at all times</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Users need to compare options side by side</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>You have only 2 options (use toggle or radio)</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>You need freeform text input (use text input)</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- VARIANTS -->
    <!-- ============================================ -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-2">Variants</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Two variants are available for different contexts and visual hierarchy needs.
      </p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Default -->
        <div class="p-4 bg-surface-base border border-stroke rounded-lg">
          <div class="flex items-start justify-between mb-3">
            <div>
              <h3 class="text-body-regular font-medium text-content-primary">Default</h3>
              <p class="text-label text-content-secondary">Standard bordered select for forms and standalone use.</p>
            </div>
            <code class="text-label bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded text-neutral-700 dark:text-neutral-300">variant="default"</code>
          </div>
          <AxisSelect
            v-model="singleValueFilled"
            :options="propertyTypes"
            label="Property Type"
            variant="default"
          />
        </div>

        <!-- Ghost -->
        <div class="p-4 bg-surface-base border border-stroke rounded-lg">
          <div class="flex items-start justify-between mb-3">
            <div>
              <h3 class="text-body-regular font-medium text-content-primary">Ghost</h3>
              <p class="text-label text-content-secondary">Borderless variant for inline or minimal contexts.</p>
            </div>
            <code class="text-label bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded text-neutral-700 dark:text-neutral-300">variant="ghost"</code>
          </div>
          <AxisSelect
            v-model="ghostValue"
            :options="propertyTypes"
            label="Property Type"
            variant="ghost"
          />
        </div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- SELECTION MODES -->
    <!-- ============================================ -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-2">Selection Modes</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Select supports both single and multiple selection modes.
      </p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Single Select -->
        <div class="p-4 bg-surface-base border border-stroke rounded-lg">
          <div class="flex items-start justify-between mb-3">
            <div>
              <h3 class="text-body-regular font-medium text-content-primary">Single Select</h3>
              <p class="text-label text-content-secondary">Select one option from the list.</p>
            </div>
            <code class="text-label bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded text-neutral-700 dark:text-neutral-300">default</code>
          </div>
          <AxisSelect
            v-model="singleValue"
            :options="propertyTypes"
            label="Property Type"
            placeholder="Select one"
          />
          <p class="mt-2 text-label text-content-tertiary">
            Selected: {{ singleValue || 'None' }}
          </p>
        </div>

        <!-- Multiple Select -->
        <div class="p-4 bg-surface-base border border-stroke rounded-lg">
          <div class="flex items-start justify-between mb-3">
            <div>
              <h3 class="text-body-regular font-medium text-content-primary">Multiple Select</h3>
              <p class="text-label text-content-secondary">Select multiple options with checkboxes.</p>
            </div>
            <code class="text-label bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded text-neutral-700 dark:text-neutral-300">multiple</code>
          </div>
          <AxisSelect
            v-model="multipleValuesFilled"
            :options="tagOptions"
            label="Tags"
            placeholder="Select tags"
            multiple
          />
          <p class="mt-2 text-label text-content-tertiary">
            Selected: {{ multipleValuesFilled.length ? multipleValuesFilled.join(', ') : 'None' }}
          </p>
        </div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- SIZES -->
    <!-- ============================================ -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-2">Sizes</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Three sizes for different contexts. Use medium (default) for most cases.
      </p>

      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="border-b border-stroke">
              <th class="py-2 pr-4 text-label-bold text-neutral-700 dark:text-neutral-300">Size</th>
              <th class="py-2 pr-4 text-label-bold text-neutral-700 dark:text-neutral-300">Height</th>
              <th class="py-2 pr-4 text-label-bold text-neutral-700 dark:text-neutral-300">Usage</th>
              <th class="py-2 text-label-bold text-neutral-700 dark:text-neutral-300 w-64">Example</th>
            </tr>
          </thead>
          <tbody class="text-body-regular text-content-secondary">
            <tr class="border-b border-stroke-subtle">
              <td class="py-3 pr-4"><code class="text-label bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">sm</code></td>
              <td class="py-3 pr-4">28px</td>
              <td class="py-3 pr-4">Compact spaces, table filters, dense forms</td>
              <td class="py-3">
                <AxisSelect
                  :options="propertyTypes"
                  size="sm"
                  placeholder="Small select"
                  :full-width="false"
                  class="w-48"
                />
              </td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-3 pr-4"><code class="text-label bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">md</code></td>
              <td class="py-3 pr-4">36px</td>
              <td class="py-3 pr-4">Standard forms, dialogs (default)</td>
              <td class="py-3">
                <AxisSelect
                  :options="propertyTypes"
                  size="md"
                  placeholder="Medium select"
                  :full-width="false"
                  class="w-48"
                />
              </td>
            </tr>
            <tr>
              <td class="py-3 pr-4"><code class="text-label bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">lg</code></td>
              <td class="py-3 pr-4">44px</td>
              <td class="py-3 pr-4">Hero sections, prominent filters</td>
              <td class="py-3">
                <AxisSelect
                  :options="propertyTypes"
                  size="lg"
                  placeholder="Large select"
                  :full-width="false"
                  class="w-48"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- STATES -->
    <!-- ============================================ -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-2">States</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Selects have multiple states to provide feedback and context.
      </p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Default -->
        <div class="p-4 bg-surface-base border border-stroke rounded-lg">
          <h3 class="text-body-regular font-medium text-content-primary mb-2">Default</h3>
          <p class="text-label text-content-secondary mb-3">Empty state, ready for selection.</p>
          <AxisSelect
            :options="propertyTypes"
            label="Label"
            placeholder="Select an option"
          />
        </div>

        <!-- Selected -->
        <div class="p-4 bg-surface-base border border-stroke rounded-lg">
          <h3 class="text-body-regular font-medium text-content-primary mb-2">Selected</h3>
          <p class="text-label text-content-secondary mb-3">With a value selected.</p>
          <AxisSelect
            :options="propertyTypes"
            label="Label"
            model-value="single-family"
          />
        </div>

        <!-- Error -->
        <div class="p-4 bg-surface-base border border-stroke rounded-lg">
          <h3 class="text-body-regular font-medium text-content-primary mb-2">Error</h3>
          <p class="text-label text-content-secondary mb-3">Invalid state with error message.</p>
          <AxisSelect
            v-model="errorValue"
            :options="propertyTypes"
            label="Label"
            placeholder="Select an option"
            error="Please select an option"
          />
        </div>

        <!-- With Hint -->
        <div class="p-4 bg-surface-base border border-stroke rounded-lg">
          <h3 class="text-body-regular font-medium text-content-primary mb-2">With Hint</h3>
          <p class="text-label text-content-secondary mb-3">Helper text for guidance.</p>
          <AxisSelect
            :options="propertyTypes"
            label="Property Type"
            placeholder="Select type"
            hint="Choose the type that best describes the property"
          />
        </div>

        <!-- Disabled -->
        <div class="p-4 bg-surface-base border border-stroke rounded-lg">
          <h3 class="text-body-regular font-medium text-content-primary mb-2">Disabled</h3>
          <p class="text-label text-content-secondary mb-3">Non-interactive state.</p>
          <AxisSelect
            :options="propertyTypes"
            label="Label"
            model-value="single-family"
            disabled
          />
        </div>

        <!-- Readonly -->
        <div class="p-4 bg-surface-base border border-stroke rounded-lg">
          <h3 class="text-body-regular font-medium text-content-primary mb-2">Readonly</h3>
          <p class="text-label text-content-secondary mb-3">Value visible but not editable.</p>
          <AxisSelect
            :options="propertyTypes"
            label="Label"
            model-value="single-family"
            readonly
          />
        </div>

        <!-- Required -->
        <div class="p-4 bg-surface-base border border-stroke rounded-lg">
          <h3 class="text-body-regular font-medium text-content-primary mb-2">Required</h3>
          <p class="text-label text-content-secondary mb-3">Mandatory field indicator.</p>
          <AxisSelect
            v-model="requiredValue"
            :options="propertyTypes"
            label="Required Field"
            placeholder="Select an option"
            required
            :error="requiredError"
            @blur="validateRequired"
          />
        </div>

        <!-- With Disabled Option -->
        <div class="p-4 bg-surface-base border border-stroke rounded-lg">
          <h3 class="text-body-regular font-medium text-content-primary mb-2">Disabled Options</h3>
          <p class="text-label text-content-secondary mb-3">Some options are not selectable.</p>
          <AxisSelect
            :options="optionsWithDisabled"
            label="Label"
            placeholder="Select an option"
          />
        </div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- FEATURES -->
    <!-- ============================================ -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-2">Features</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Additional features to enhance usability.
      </p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Searchable -->
        <div class="p-4 bg-surface-base border border-stroke rounded-lg">
          <div class="flex items-start justify-between mb-3">
            <div>
              <h3 class="text-body-regular font-medium text-content-primary">Searchable</h3>
              <p class="text-label text-content-secondary">Filter options by typing.</p>
            </div>
            <code class="text-label bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded text-neutral-700 dark:text-neutral-300">searchable</code>
          </div>
          <AxisSelect
            v-model="stateValue"
            :options="states"
            label="State"
            placeholder="Search states..."
            searchable
          />
        </div>

        <!-- With Icons -->
        <div class="p-4 bg-surface-base border border-stroke rounded-lg">
          <div class="flex items-start justify-between mb-3">
            <div>
              <h3 class="text-body-regular font-medium text-content-primary">With Icons</h3>
              <p class="text-label text-content-secondary">Options with icon decoration.</p>
            </div>
            <code class="text-label bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded text-neutral-700 dark:text-neutral-300">icon in options</code>
          </div>
          <AxisSelect
            v-model="iconValue"
            :options="propertyTypesWithIcons"
            label="Property Type"
            placeholder="Select type"
          />
        </div>

        <!-- With Left Icon -->
        <div class="p-4 bg-surface-base border border-stroke rounded-lg">
          <div class="flex items-start justify-between mb-3">
            <div>
              <h3 class="text-body-regular font-medium text-content-primary">Left Icon</h3>
              <p class="text-label text-content-secondary">Icon in the trigger button.</p>
            </div>
            <code class="text-label bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded text-neutral-700 dark:text-neutral-300">icon-left</code>
          </div>
          <AxisSelect
            :options="propertyTypes"
            label="Filter by Type"
            placeholder="Select type"
            :icon-left="FunnelIcon"
          />
        </div>

        <!-- Searchable Multi-select -->
        <div class="p-4 bg-surface-base border border-stroke rounded-lg">
          <div class="flex items-start justify-between mb-3">
            <div>
              <h3 class="text-body-regular font-medium text-content-primary">Searchable Multi-Select</h3>
              <p class="text-label text-content-secondary">Combined search with multiple selection.</p>
            </div>
            <code class="text-label bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded text-neutral-700 dark:text-neutral-300">searchable multiple</code>
          </div>
          <AxisSelect
            v-model="multipleValues"
            :options="tagOptions"
            label="Tags"
            placeholder="Search and select..."
            searchable
            multiple
          />
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
              <span>Always include a label for accessibility</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Use clear, concise option labels</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Order options logically (alphabetical, most common first)</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Use placeholder text to indicate expected selection</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Provide hint text for complex requirements</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Mark required fields with an asterisk</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Use searchable for lists with 10+ options</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Keep option labels short (2-4 words)</span>
            </li>
          </ul>
        </div>

        <!-- Don'ts -->
        <div>
          <h3 class="text-h5 text-error-700 dark:text-error-400 mb-3">Don't</h3>
          <ul class="space-y-2 text-body-regular text-content-secondary">
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Use placeholder as a replacement for labels</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Have more than 15 options without search</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Use multi-select when order matters</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Disable all options (hide the select instead)</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Create custom select styles outside this system</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Use select for binary choices (use toggle)</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Nest selects within selects</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Use vague labels like "Choose" or "Pick one"</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- API REFERENCE -->
    <!-- ============================================ -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-3">API Reference</h2>

      <h3 class="text-body-regular font-medium text-content-primary mb-2">Props</h3>
      <div class="overflow-x-auto mb-6">
        <table class="w-full text-left">
          <thead>
            <tr class="border-b border-stroke">
              <th class="py-2 pr-4 text-label-bold text-neutral-700 dark:text-neutral-300">Prop</th>
              <th class="py-2 pr-4 text-label-bold text-neutral-700 dark:text-neutral-300">Type</th>
              <th class="py-2 pr-4 text-label-bold text-neutral-700 dark:text-neutral-300">Default</th>
              <th class="py-2 text-label-bold text-neutral-700 dark:text-neutral-300">Description</th>
            </tr>
          </thead>
          <tbody class="text-body-regular text-content-secondary">
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">v-model</code></td>
              <td class="py-2 pr-4 text-label">string | number | array | null</td>
              <td class="py-2 pr-4 text-label">null</td>
              <td class="py-2 text-label">Selected value(s)</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">options</code></td>
              <td class="py-2 pr-4 text-label">SelectOption[]</td>
              <td class="py-2 pr-4 text-label">required</td>
              <td class="py-2 text-label">Array of options with value, label, icon?, disabled?</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">variant</code></td>
              <td class="py-2 pr-4 text-label">'default' | 'ghost'</td>
              <td class="py-2 pr-4 text-label">'default'</td>
              <td class="py-2 text-label">Visual variant</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">size</code></td>
              <td class="py-2 pr-4 text-label">'sm' | 'md' | 'lg'</td>
              <td class="py-2 pr-4 text-label">'md'</td>
              <td class="py-2 text-label">Select size</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">label</code></td>
              <td class="py-2 pr-4 text-label">string</td>
              <td class="py-2 pr-4 text-label">''</td>
              <td class="py-2 text-label">Label text above select</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">placeholder</code></td>
              <td class="py-2 pr-4 text-label">string</td>
              <td class="py-2 pr-4 text-label">'Select an option'</td>
              <td class="py-2 text-label">Placeholder text</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">hint</code></td>
              <td class="py-2 pr-4 text-label">string</td>
              <td class="py-2 pr-4 text-label">''</td>
              <td class="py-2 text-label">Helper text below select</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">error</code></td>
              <td class="py-2 pr-4 text-label">string</td>
              <td class="py-2 pr-4 text-label">''</td>
              <td class="py-2 text-label">Error message (sets error state)</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">multiple</code></td>
              <td class="py-2 pr-4 text-label">boolean</td>
              <td class="py-2 pr-4 text-label">false</td>
              <td class="py-2 text-label">Allow multiple selection</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">searchable</code></td>
              <td class="py-2 pr-4 text-label">boolean</td>
              <td class="py-2 pr-4 text-label">false</td>
              <td class="py-2 text-label">Enable search filtering</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">disabled</code></td>
              <td class="py-2 pr-4 text-label">boolean</td>
              <td class="py-2 pr-4 text-label">false</td>
              <td class="py-2 text-label">Disable the select</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">readonly</code></td>
              <td class="py-2 pr-4 text-label">boolean</td>
              <td class="py-2 pr-4 text-label">false</td>
              <td class="py-2 text-label">Make select read-only</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">required</code></td>
              <td class="py-2 pr-4 text-label">boolean</td>
              <td class="py-2 pr-4 text-label">false</td>
              <td class="py-2 text-label">Mark as required field</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">icon-left</code></td>
              <td class="py-2 pr-4 text-label">Component</td>
              <td class="py-2 pr-4 text-label">null</td>
              <td class="py-2 text-label">Icon component for left side</td>
            </tr>
            <tr>
              <td class="py-2 pr-4"><code class="text-label bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">maxVisibleOptions</code></td>
              <td class="py-2 pr-4 text-label">number</td>
              <td class="py-2 pr-4 text-label">6</td>
              <td class="py-2 text-label">Max visible options before scrolling</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="text-body-regular font-medium text-content-primary mb-2">SelectOption Interface</h3>
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="border-b border-stroke">
              <th class="py-2 pr-4 text-label-bold text-neutral-700 dark:text-neutral-300">Property</th>
              <th class="py-2 pr-4 text-label-bold text-neutral-700 dark:text-neutral-300">Type</th>
              <th class="py-2 pr-4 text-label-bold text-neutral-700 dark:text-neutral-300">Required</th>
              <th class="py-2 text-label-bold text-neutral-700 dark:text-neutral-300">Description</th>
            </tr>
          </thead>
          <tbody class="text-body-regular text-content-secondary">
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">value</code></td>
              <td class="py-2 pr-4 text-label">string | number</td>
              <td class="py-2 pr-4 text-label">Yes</td>
              <td class="py-2 text-label">Unique identifier for the option</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">label</code></td>
              <td class="py-2 pr-4 text-label">string</td>
              <td class="py-2 pr-4 text-label">Yes</td>
              <td class="py-2 text-label">Display text for the option</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">icon</code></td>
              <td class="py-2 pr-4 text-label">Component</td>
              <td class="py-2 pr-4 text-label">No</td>
              <td class="py-2 text-label">Optional icon component</td>
            </tr>
            <tr>
              <td class="py-2 pr-4"><code class="text-label bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">disabled</code></td>
              <td class="py-2 pr-4 text-label">boolean</td>
              <td class="py-2 pr-4 text-label">No</td>
              <td class="py-2 text-label">Whether the option is disabled</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- EVENTS -->
    <!-- ============================================ -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-3">Events</h2>

      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="border-b border-stroke">
              <th class="py-2 pr-4 text-label-bold text-neutral-700 dark:text-neutral-300">Event</th>
              <th class="py-2 pr-4 text-label-bold text-neutral-700 dark:text-neutral-300">Payload</th>
              <th class="py-2 text-label-bold text-neutral-700 dark:text-neutral-300">Description</th>
            </tr>
          </thead>
          <tbody class="text-body-regular text-content-secondary">
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">update:modelValue</code></td>
              <td class="py-2 pr-4 text-label">string | number | array | null</td>
              <td class="py-2 text-label">Emitted when selection changes (v-model)</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">focus</code></td>
              <td class="py-2 pr-4 text-label">void</td>
              <td class="py-2 text-label">Emitted when select receives focus</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">blur</code></td>
              <td class="py-2 pr-4 text-label">void</td>
              <td class="py-2 text-label">Emitted when select loses focus</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">open</code></td>
              <td class="py-2 pr-4 text-label">void</td>
              <td class="py-2 text-label">Emitted when dropdown opens</td>
            </tr>
            <tr>
              <td class="py-2 pr-4"><code class="text-label bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">close</code></td>
              <td class="py-2 pr-4 text-label">void</td>
              <td class="py-2 text-label">Emitted when dropdown closes</td>
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
            <li><strong>Enter / Space:</strong> Open dropdown or select highlighted option</li>
            <li><strong>Escape:</strong> Close dropdown and return focus to trigger</li>
            <li><strong>Arrow Down:</strong> Open dropdown or move to next option</li>
            <li><strong>Arrow Up:</strong> Open dropdown or move to previous option</li>
            <li><strong>Home:</strong> Move to first option</li>
            <li><strong>End:</strong> Move to last option</li>
            <li><strong>Tab:</strong> Close dropdown and move to next focusable element</li>
            <li><strong>Type characters:</strong> Filter options (when searchable)</li>
          </ul>
        </div>

        <div class="p-4 bg-surface-raised border border-stroke rounded-lg">
          <h3 class="text-body-regular font-medium text-content-primary mb-2">ARIA Attributes</h3>
          <ul class="text-label text-neutral-700 dark:text-neutral-300 space-y-1">
            <li><code class="bg-neutral-200 dark:bg-neutral-700 px-1 rounded">role="listbox"</code> - Applied to dropdown panel</li>
            <li><code class="bg-neutral-200 dark:bg-neutral-700 px-1 rounded">role="option"</code> - Applied to each option</li>
            <li><code class="bg-neutral-200 dark:bg-neutral-700 px-1 rounded">aria-expanded</code> - Indicates dropdown state</li>
            <li><code class="bg-neutral-200 dark:bg-neutral-700 px-1 rounded">aria-haspopup</code> - Indicates popup type</li>
            <li><code class="bg-neutral-200 dark:bg-neutral-700 px-1 rounded">aria-selected</code> - Indicates selected option</li>
            <li><code class="bg-neutral-200 dark:bg-neutral-700 px-1 rounded">aria-multiselectable</code> - For multi-select mode</li>
            <li><code class="bg-neutral-200 dark:bg-neutral-700 px-1 rounded">aria-invalid</code> - Set when error is present</li>
            <li><code class="bg-neutral-200 dark:bg-neutral-700 px-1 rounded">aria-describedby</code> - Links to hint/error message</li>
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
            <span class="text-label-bold text-neutral-700 dark:text-neutral-300">Basic Usage</span>
            <button
              class="text-label text-main-700 dark:text-main-400 hover:text-main-900 dark:hover:text-main-200"
              @click="copyToClipboard(codeExamples.basic)"
            >
              {{ copiedCode === codeExamples.basic ? 'Copied!' : 'Copy' }}
            </button>
          </div>
          <pre class="p-4 text-label bg-neutral-900 overflow-x-auto"><code class="text-neutral-100">{{ codeExamples.basic }}</code></pre>
        </div>

        <!-- Multiple Selection -->
        <div class="border border-stroke rounded-lg overflow-hidden">
          <div class="px-4 py-2 bg-surface-raised border-b border-stroke flex items-center justify-between">
            <span class="text-label-bold text-neutral-700 dark:text-neutral-300">Multiple Selection</span>
            <button
              class="text-label text-main-700 dark:text-main-400 hover:text-main-900 dark:hover:text-main-200"
              @click="copyToClipboard(codeExamples.multiple)"
            >
              {{ copiedCode === codeExamples.multiple ? 'Copied!' : 'Copy' }}
            </button>
          </div>
          <pre class="p-4 text-label bg-neutral-900 overflow-x-auto"><code class="text-neutral-100">{{ codeExamples.multiple }}</code></pre>
        </div>

        <!-- Searchable -->
        <div class="border border-stroke rounded-lg overflow-hidden">
          <div class="px-4 py-2 bg-surface-raised border-b border-stroke flex items-center justify-between">
            <span class="text-label-bold text-neutral-700 dark:text-neutral-300">Searchable</span>
            <button
              class="text-label text-main-700 dark:text-main-400 hover:text-main-900 dark:hover:text-main-200"
              @click="copyToClipboard(codeExamples.searchable)"
            >
              {{ copiedCode === codeExamples.searchable ? 'Copied!' : 'Copy' }}
            </button>
          </div>
          <pre class="p-4 text-label bg-neutral-900 overflow-x-auto"><code class="text-neutral-100">{{ codeExamples.searchable }}</code></pre>
        </div>

        <!-- With Validation -->
        <div class="border border-stroke rounded-lg overflow-hidden">
          <div class="px-4 py-2 bg-surface-raised border-b border-stroke flex items-center justify-between">
            <span class="text-label-bold text-neutral-700 dark:text-neutral-300">With Validation</span>
            <button
              class="text-label text-main-700 dark:text-main-400 hover:text-main-900 dark:hover:text-main-200"
              @click="copyToClipboard(codeExamples.validation)"
            >
              {{ copiedCode === codeExamples.validation ? 'Copied!' : 'Copy' }}
            </button>
          </div>
          <pre class="p-4 text-label bg-neutral-900 overflow-x-auto"><code class="text-neutral-100">{{ codeExamples.validation }}</code></pre>
        </div>
      </div>
    </div>
  </div>
</template>
