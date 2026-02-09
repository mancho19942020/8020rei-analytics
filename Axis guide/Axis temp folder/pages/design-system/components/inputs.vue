<script setup lang="ts">
import {
  EnvelopeIcon,
  PhoneIcon,
  GlobeAltIcon,
  CurrencyDollarIcon,
  MagnifyingGlassIcon,
  UserIcon,
  LockClosedIcon,
  CheckIcon,
  XMarkIcon,
  MapPinIcon,
  BuildingOfficeIcon,
} from "@heroicons/vue/24/outline";

definePageMeta({
  layout: "design-system",
});

useHead({
  title: "Inputs | Components | Design System | 8020",
});

// ============================================
// INPUT SPECIFICATION - AXIS DESIGN SYSTEM
// Source of truth - NO EXCEPTIONS
// ============================================

// Demo form values
const textValue = ref("");
const emailValue = ref("");
const passwordValue = ref("");
const phoneValue = ref("");
const searchValue = ref("");
const numberValue = ref("");

// Demo error state
const emailError = ref("");
const validateEmail = () => {
  if (emailValue.value && !emailValue.value.includes("@")) {
    emailError.value = "Please enter a valid email address";
  } else {
    emailError.value = "";
  }
};

// ============================================
// AUTOCOMPLETE DEMO VALUES
// ============================================
const cityValue = ref("");
const stateValue = ref("");
const autocompleteDisabledValue = ref("");
const autocompleteErrorValue = ref("");

// Sample city options for demo
const cityOptions = [
  { value: "nyc", label: "New York" },
  { value: "la", label: "Los Angeles" },
  { value: "chi", label: "Chicago" },
  { value: "hou", label: "Houston" },
  { value: "phx", label: "Phoenix" },
  { value: "phi", label: "Philadelphia" },
  { value: "sa", label: "San Antonio" },
  { value: "sd", label: "San Diego" },
  { value: "dal", label: "Dallas" },
  { value: "sj", label: "San Jose" },
];

// Sample state options with icons for demo
const stateOptions = [
  { value: "ca", label: "California", icon: MapPinIcon },
  { value: "tx", label: "Texas", icon: MapPinIcon },
  { value: "fl", label: "Florida", icon: MapPinIcon },
  { value: "ny", label: "New York", icon: MapPinIcon },
  { value: "il", label: "Illinois", icon: MapPinIcon },
];

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

// Code examples as strings to avoid Vue parsing issues
const codeExamples = {
  basic: `<AxisInput
  v-model="name"
  label="Name"
  placeholder="Enter your name"
/>`,
  validation: ["<scr", "ipt setup>"].join("") + `
const email = ref('')
const emailError = ref('')

const validateEmail = () => {
  if (!email.value.includes('@')) {
    emailError.value = 'Please enter a valid email'
  } else {
    emailError.value = ''
  }
}
` + ["</scr", "ipt>"].join("") + `

` + ["<temp", "late>"].join("") + `
  <AxisInput
    v-model="email"
    type="email"
    label="Email"
    :error="emailError"
    @blur="validateEmail"
  />
` + ["</temp", "late>"].join(""),
  withIcons: ["<scr", "ipt setup>"].join("") + `
import { MagnifyingGlassIcon } from '@heroicons/vue/24/outline'
` + ["</scr", "ipt>"].join("") + `

` + ["<temp", "late>"].join("") + `
  <AxisInput
    v-model="search"
    type="search"
    placeholder="Search..."
    :icon-left="MagnifyingGlassIcon"
  />
` + ["</temp", "late>"].join(""),
  // Autocomplete examples
  autocompleteBasic: `<AxisAutocomplete
  v-model="city"
  :options="cityOptions"
  label="City"
  placeholder="Type or select a city"
/>`,
  autocompleteWithIcon: ["<scr", "ipt setup>"].join("") + `
import { MapPinIcon } from '@heroicons/vue/24/outline'

const stateOptions = [
  { value: 'ca', label: 'California', icon: MapPinIcon },
  { value: 'tx', label: 'Texas', icon: MapPinIcon },
]
` + ["</scr", "ipt>"].join("") + `

` + ["<temp", "late>"].join("") + `
  <AxisAutocomplete
    v-model="state"
    :options="stateOptions"
    label="State"
    :icon-left="MapPinIcon"
  />
` + ["</temp", "late>"].join(""),
  autocompleteMinChars: `<AxisAutocomplete
  v-model="city"
  :options="cityOptions"
  label="City"
  placeholder="Type at least 2 characters..."
  :min-chars-for-suggestions="2"
/>`,
};
</script>

<template>
  <div>
    <!-- Header -->
    <div class="docs-section">
      <h1 class="text-h2 text-content-primary">Inputs</h1>
      <p class="text-body-regular text-content-secondary">
        Text inputs allow users to enter and edit text. They are essential for forms, search, and data entry.
      </p>
    </div>

    <!-- Overview -->
    <div class="docs-section-highlight">
      <h2 class="text-h4 text-content-primary mb-2">Overview</h2>
      <p class="text-body-regular text-content-secondary mb-3">
        Text inputs enable users to enter freeform text data. They support labels, hints, validation errors,
        and various input types for specific data formats.
      </p>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl">
        <AxisInput
          v-model="textValue"
          label="Name"
          placeholder="Enter your name"
        />
        <AxisInput
          v-model="emailValue"
          type="email"
          label="Email"
          placeholder="you@example.com"
          :icon-left="EnvelopeIcon"
        />
        <AxisInput
          v-model="passwordValue"
          type="password"
          label="Password"
          placeholder="Enter password"
        />
      </div>
    </div>

    <!-- MANDATORY RULE Notice -->
    <div class="docs-section">
      <AxisCallout type="warning" title="Mandatory Rule - No Exceptions">
        All text inputs in the platform MUST use the <code class="bg-alert-100 dark:bg-alert-900 px-1 rounded">AxisInput</code> component.
        Raw HTML inputs or custom input styles are <strong>strictly prohibited</strong>.
      </AxisCallout>
    </div>

    <!-- ============================================ -->
    <!-- INPUT TYPES -->
    <!-- ============================================ -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-2">Input Types</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Different input types provide appropriate keyboards on mobile and enable browser validation.
      </p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Text -->
        <div class="p-4 bg-surface-base border border-stroke rounded-lg">
          <div class="flex items-start justify-between mb-3">
            <div>
              <h3 class="text-body-regular font-medium text-content-primary">Text (Default)</h3>
              <p class="text-label text-content-secondary">General text input for names, descriptions, etc.</p>
            </div>
            <code class="text-label bg-surface-raised dark:bg-neutral-800 px-2 py-1 rounded text-content-secondary">type="text"</code>
          </div>
          <AxisInput
            v-model="textValue"
            label="Full Name"
            placeholder="John Doe"
            :icon-left="UserIcon"
          />
        </div>

        <!-- Email -->
        <div class="p-4 bg-surface-base border border-stroke rounded-lg">
          <div class="flex items-start justify-between mb-3">
            <div>
              <h3 class="text-body-regular font-medium text-content-primary">Email</h3>
              <p class="text-label text-content-secondary">Email addresses with validation.</p>
            </div>
            <code class="text-label bg-surface-raised dark:bg-neutral-800 px-2 py-1 rounded text-content-secondary">type="email"</code>
          </div>
          <AxisInput
            v-model="emailValue"
            type="email"
            label="Email Address"
            placeholder="you@example.com"
            :icon-left="EnvelopeIcon"
            :error="emailError"
            @blur="validateEmail"
          />
        </div>

        <!-- Password -->
        <div class="p-4 bg-surface-base border border-stroke rounded-lg">
          <div class="flex items-start justify-between mb-3">
            <div>
              <h3 class="text-body-regular font-medium text-content-primary">Password</h3>
              <p class="text-label text-content-secondary">Secure password input with visibility toggle.</p>
            </div>
            <code class="text-label bg-surface-raised dark:bg-neutral-800 px-2 py-1 rounded text-content-secondary">type="password"</code>
          </div>
          <AxisInput
            v-model="passwordValue"
            type="password"
            label="Password"
            placeholder="Enter password"
            hint="Must be at least 8 characters"
          />
        </div>

        <!-- Phone -->
        <div class="p-4 bg-surface-base border border-stroke rounded-lg">
          <div class="flex items-start justify-between mb-3">
            <div>
              <h3 class="text-body-regular font-medium text-content-primary">Phone</h3>
              <p class="text-label text-content-secondary">Phone number input with numeric keyboard.</p>
            </div>
            <code class="text-label bg-surface-raised dark:bg-neutral-800 px-2 py-1 rounded text-content-secondary">type="tel"</code>
          </div>
          <AxisInput
            v-model="phoneValue"
            type="tel"
            label="Phone Number"
            placeholder="(555) 123-4567"
            :icon-left="PhoneIcon"
          />
        </div>

        <!-- Search -->
        <div class="p-4 bg-surface-base border border-stroke rounded-lg">
          <div class="flex items-start justify-between mb-3">
            <div>
              <h3 class="text-body-regular font-medium text-content-primary">Search</h3>
              <p class="text-label text-content-secondary">Search input with clear button.</p>
            </div>
            <code class="text-label bg-surface-raised dark:bg-neutral-800 px-2 py-1 rounded text-content-secondary">type="search"</code>
          </div>
          <AxisInput
            v-model="searchValue"
            type="search"
            label="Search"
            placeholder="Search properties..."
            :icon-left="MagnifyingGlassIcon"
          />
        </div>

        <!-- Number -->
        <div class="p-4 bg-surface-base border border-stroke rounded-lg">
          <div class="flex items-start justify-between mb-3">
            <div>
              <h3 class="text-body-regular font-medium text-content-primary">Number</h3>
              <p class="text-label text-content-secondary">Numeric input for quantities, amounts.</p>
            </div>
            <code class="text-label bg-surface-raised dark:bg-neutral-800 px-2 py-1 rounded text-content-secondary">type="number"</code>
          </div>
          <AxisInput
            v-model="numberValue"
            type="number"
            label="Amount"
            placeholder="0.00"
            :icon-left="CurrencyDollarIcon"
          />
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
              <th class="py-2 pr-4 text-label-bold text-content-secondary">Size</th>
              <th class="py-2 pr-4 text-label-bold text-content-secondary">Height</th>
              <th class="py-2 pr-4 text-label-bold text-content-secondary">Usage</th>
              <th class="py-2 text-label-bold text-neutral-700 dark:text-neutral-300 w-64">Example</th>
            </tr>
          </thead>
          <tbody class="text-body-regular text-content-secondary">
            <tr class="border-b border-stroke-subtle">
              <td class="py-3 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">sm</code></td>
              <td class="py-3 pr-4">28px</td>
              <td class="py-3 pr-4">Compact spaces, tables, dense forms</td>
              <td class="py-3"><AxisInput size="sm" placeholder="Small input" /></td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-3 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">md</code></td>
              <td class="py-3 pr-4">36px</td>
              <td class="py-3 pr-4">Standard forms, dialogs</td>
              <td class="py-3"><AxisInput size="md" placeholder="Medium input" /></td>
            </tr>
            <tr>
              <td class="py-3 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">lg</code></td>
              <td class="py-3 pr-4">44px</td>
              <td class="py-3 pr-4">Hero sections, prominent search</td>
              <td class="py-3"><AxisInput size="lg" placeholder="Large input" /></td>
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
        Inputs have multiple states to provide feedback and context.
      </p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Default -->
        <div class="p-4 bg-surface-base border border-stroke rounded-lg">
          <h3 class="text-body-regular font-medium text-content-primary mb-2">Default</h3>
          <p class="text-label text-content-secondary mb-3">Empty state, ready for input.</p>
          <AxisInput label="Label" placeholder="Placeholder text" />
        </div>

        <!-- With Value -->
        <div class="p-4 bg-surface-base border border-stroke rounded-lg">
          <h3 class="text-body-regular font-medium text-content-primary mb-2">Filled</h3>
          <p class="text-label text-content-secondary mb-3">Input with a value entered.</p>
          <AxisInput label="Label" model-value="Entered value" />
        </div>

        <!-- Error -->
        <div class="p-4 bg-surface-base border border-stroke rounded-lg">
          <h3 class="text-body-regular font-medium text-content-primary mb-2">Error</h3>
          <p class="text-label text-content-secondary mb-3">Invalid input with error message.</p>
          <AxisInput
            label="Email"
            model-value="invalid-email"
            error="Please enter a valid email address"
          />
        </div>

        <!-- With Hint -->
        <div class="p-4 bg-surface-base border border-stroke rounded-lg">
          <h3 class="text-body-regular font-medium text-content-primary mb-2">With Hint</h3>
          <p class="text-label text-content-secondary mb-3">Helper text for guidance.</p>
          <AxisInput
            label="Password"
            type="password"
            placeholder="Enter password"
            hint="Must be at least 8 characters"
          />
        </div>

        <!-- Disabled -->
        <div class="p-4 bg-surface-base border border-stroke rounded-lg">
          <h3 class="text-body-regular font-medium text-content-primary mb-2">Disabled</h3>
          <p class="text-label text-content-secondary mb-3">Non-interactive state.</p>
          <AxisInput
            label="Label"
            model-value="Disabled value"
            disabled
          />
        </div>

        <!-- Readonly -->
        <div class="p-4 bg-surface-base border border-stroke rounded-lg">
          <h3 class="text-body-regular font-medium text-content-primary mb-2">Readonly</h3>
          <p class="text-label text-content-secondary mb-3">Value visible but not editable.</p>
          <AxisInput
            label="Label"
            model-value="Read-only value"
            readonly
          />
        </div>

        <!-- Required -->
        <div class="p-4 bg-surface-base border border-stroke rounded-lg">
          <h3 class="text-body-regular font-medium text-content-primary mb-2">Required</h3>
          <p class="text-label text-content-secondary mb-3">Mandatory field indicator.</p>
          <AxisInput
            label="Required Field"
            placeholder="This field is required"
            required
          />
        </div>

        <!-- With Icons -->
        <div class="p-4 bg-surface-base border border-stroke rounded-lg">
          <h3 class="text-body-regular font-medium text-content-primary mb-2">With Icon</h3>
          <p class="text-label text-content-secondary mb-3">Icon for visual context.</p>
          <AxisInput
            label="Website"
            placeholder="https://example.com"
            :icon-left="GlobeAltIcon"
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
              <span>Use placeholder text for format hints only</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Show error messages below the input</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Use appropriate input types for data</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Provide hint text for complex requirements</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Mark required fields with an asterisk</span>
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
              <span>Show errors before user interaction</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Disable inputs without explanation</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Create custom input styles outside this system</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Use color alone to indicate state</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Make labels too long or complex</span>
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
              <td class="py-2 pr-4 text-label">string | number</td>
              <td class="py-2 pr-4 text-label">''</td>
              <td class="py-2 text-label">Input value (two-way binding)</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">type</code></td>
              <td class="py-2 pr-4 text-label">'text' | 'email' | 'password' | 'tel' | 'url' | 'number' | 'search'</td>
              <td class="py-2 pr-4 text-label">'text'</td>
              <td class="py-2 text-label">Input type</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">size</code></td>
              <td class="py-2 pr-4 text-label">'sm' | 'md' | 'lg'</td>
              <td class="py-2 pr-4 text-label">'md'</td>
              <td class="py-2 text-label">Input size</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">label</code></td>
              <td class="py-2 pr-4 text-label">string</td>
              <td class="py-2 pr-4 text-label">''</td>
              <td class="py-2 text-label">Label text above input</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">placeholder</code></td>
              <td class="py-2 pr-4 text-label">string</td>
              <td class="py-2 pr-4 text-label">''</td>
              <td class="py-2 text-label">Placeholder text</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">hint</code></td>
              <td class="py-2 pr-4 text-label">string</td>
              <td class="py-2 pr-4 text-label">''</td>
              <td class="py-2 text-label">Helper text below input</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">error</code></td>
              <td class="py-2 pr-4 text-label">string</td>
              <td class="py-2 pr-4 text-label">''</td>
              <td class="py-2 text-label">Error message (sets error state)</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">disabled</code></td>
              <td class="py-2 pr-4 text-label">boolean</td>
              <td class="py-2 pr-4 text-label">false</td>
              <td class="py-2 text-label">Disable the input</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">readonly</code></td>
              <td class="py-2 pr-4 text-label">boolean</td>
              <td class="py-2 pr-4 text-label">false</td>
              <td class="py-2 text-label">Make input read-only</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">required</code></td>
              <td class="py-2 pr-4 text-label">boolean</td>
              <td class="py-2 pr-4 text-label">false</td>
              <td class="py-2 text-label">Mark as required field</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">icon-left</code></td>
              <td class="py-2 pr-4 text-label">Component</td>
              <td class="py-2 pr-4 text-label">null</td>
              <td class="py-2 text-label">Icon component for left side</td>
            </tr>
            <tr>
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">icon-right</code></td>
              <td class="py-2 pr-4 text-label">Component</td>
              <td class="py-2 pr-4 text-label">null</td>
              <td class="py-2 text-label">Icon component for right side</td>
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
              <th class="py-2 pr-4 text-label-bold text-content-secondary">Event</th>
              <th class="py-2 pr-4 text-label-bold text-content-secondary">Payload</th>
              <th class="py-2 text-label-bold text-neutral-700 dark:text-neutral-300">Description</th>
            </tr>
          </thead>
          <tbody class="text-body-regular text-content-secondary">
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">update:modelValue</code></td>
              <td class="py-2 pr-4 text-label">string | number</td>
              <td class="py-2 text-label">Emitted when value changes (v-model)</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">focus</code></td>
              <td class="py-2 pr-4 text-label">FocusEvent</td>
              <td class="py-2 text-label">Emitted when input receives focus</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">blur</code></td>
              <td class="py-2 pr-4 text-label">FocusEvent</td>
              <td class="py-2 text-label">Emitted when input loses focus</td>
            </tr>
            <tr>
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">input</code></td>
              <td class="py-2 pr-4 text-label">Event</td>
              <td class="py-2 text-label">Emitted on each input event</td>
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
            <li><strong>Tab:</strong> Move focus to the input</li>
            <li><strong>Typing:</strong> Enter text normally</li>
            <li><strong>Focus ring:</strong> Visible focus indicator for keyboard users</li>
          </ul>
        </div>

        <div class="p-4 bg-surface-raised border border-stroke rounded-lg">
          <h3 class="text-body-regular font-medium text-content-primary mb-2">ARIA Attributes</h3>
          <ul class="text-label text-content-secondary space-y-1">
            <li><code class="bg-surface-raised dark:bg-neutral-700 px-1 rounded">aria-invalid</code> - Set when error is present</li>
            <li><code class="bg-surface-raised dark:bg-neutral-700 px-1 rounded">aria-describedby</code> - Links to hint/error message</li>
            <li><code class="bg-surface-raised dark:bg-neutral-700 px-1 rounded">aria-required</code> - Set when required</li>
            <li><code class="bg-surface-raised dark:bg-neutral-700 px-1 rounded">aria-hidden</code> - Applied to icons</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- CODE EXAMPLES -->
    <!-- ============================================ -->
    <div class="docs-section">
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

        <!-- With Validation -->
        <div class="border border-stroke rounded-lg overflow-hidden">
          <div class="px-4 py-2 bg-surface-raised border-b border-stroke flex items-center justify-between">
            <span class="text-label-bold text-content-secondary">With Validation</span>
            <button
              class="text-label text-main-700 dark:text-main-400 hover:text-main-900 dark:hover:text-main-200"
              @click="copyToClipboard(codeExamples.validation)"
            >
              {{ copiedCode === codeExamples.validation ? 'Copied!' : 'Copy' }}
            </button>
          </div>
          <pre class="p-4 text-label bg-neutral-900 overflow-x-auto"><code class="text-neutral-100">{{ codeExamples.validation }}</code></pre>
        </div>

        <!-- With Icons -->
        <div class="border border-stroke rounded-lg overflow-hidden">
          <div class="px-4 py-2 bg-surface-raised border-b border-stroke flex items-center justify-between">
            <span class="text-label-bold text-content-secondary">With Icons</span>
            <button
              class="text-label text-main-700 dark:text-main-400 hover:text-main-900 dark:hover:text-main-200"
              @click="copyToClipboard(codeExamples.withIcons)"
            >
              {{ copiedCode === codeExamples.withIcons ? 'Copied!' : 'Copy' }}
            </button>
          </div>
          <pre class="p-4 text-label bg-neutral-900 overflow-x-auto"><code class="text-neutral-100">{{ codeExamples.withIcons }}</code></pre>
        </div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- AUTOCOMPLETE SECTION DIVIDER -->
    <!-- ============================================ -->
    <div class="docs-section border-t-2 border-main-200 dark:border-main-800 pt-8">
      <div class="flex items-center gap-3 mb-2">
        <span class="px-2 py-0.5 bg-main-100 dark:bg-main-900 text-main-700 dark:text-main-300 text-label-bold rounded">Component</span>
        <h2 class="text-h3 text-content-primary">Autocomplete</h2>
      </div>
      <p class="text-body-regular text-content-secondary">
        A text input with autocomplete suggestions. Allows free-text entry while optionally selecting from a list of options.
      </p>
    </div>

    <!-- Autocomplete Overview -->
    <div class="docs-section-highlight">
      <h3 class="text-h4 text-content-primary mb-2">Overview</h3>
      <p class="text-body-regular text-content-secondary mb-3">
        Unlike <code class="bg-surface-raised dark:bg-neutral-800 px-1 rounded">AxisSelect</code> which requires selecting from predefined options,
        <code class="bg-surface-raised dark:bg-neutral-800 px-1 rounded">AxisAutocomplete</code> allows users to type freely and optionally
        select from suggestions. Use it for fields like city names, tags, or any input where suggestions help but custom values are allowed.
      </p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl">
        <AxisAutocomplete
          v-model="cityValue"
          :options="cityOptions"
          label="City"
          placeholder="Type or select a city"
        />
        <AxisAutocomplete
          v-model="stateValue"
          :options="stateOptions"
          label="State"
          placeholder="Type or select..."
          :icon-left="MapPinIcon"
        />
      </div>
    </div>

    <!-- When to Use -->
    <div class="docs-section">
      <h3 class="text-h4 text-content-primary mb-3">When to Use</h3>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="p-4 bg-success-50 dark:bg-success-950 border border-success-200 dark:border-success-800 rounded-lg">
          <h4 class="text-body-regular font-medium text-success-900 dark:text-success-100 mb-2">Use AxisAutocomplete</h4>
          <ul class="text-label text-success-800 dark:text-success-300 space-y-1">
            <li>• User can type custom values not in the list</li>
            <li>• Suggestions help but aren't required</li>
            <li>• Large option sets with search filtering</li>
            <li>• City/location inputs, tags, names</li>
            <li>• When you want type-ahead behavior</li>
          </ul>
        </div>

        <div class="p-4 bg-info-50 dark:bg-info-950 border border-info-200 dark:border-info-800 rounded-lg">
          <h4 class="text-body-regular font-medium text-info-900 dark:text-info-100 mb-2">Use AxisSelect Instead</h4>
          <ul class="text-label text-info-800 dark:text-info-300 space-y-1">
            <li>• User must choose from predefined options</li>
            <li>• Small list of options (under 10)</li>
            <li>• Value must match backend enum/options</li>
            <li>• Status dropdowns, categories, types</li>
            <li>• When custom values aren't valid</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Autocomplete States -->
    <div class="docs-section">
      <h3 class="text-h4 text-content-primary mb-2">States</h3>
      <p class="text-body-regular text-content-secondary mb-4">
        Autocomplete supports the same states as regular inputs.
      </p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Default -->
        <div class="p-4 bg-surface-base border border-stroke rounded-lg">
          <h4 class="text-body-regular font-medium text-content-primary mb-2">Default</h4>
          <p class="text-label text-content-secondary mb-3">Ready for input with suggestions.</p>
          <AxisAutocomplete
            :options="cityOptions"
            label="City"
            placeholder="Type to search..."
          />
        </div>

        <!-- With Value -->
        <div class="p-4 bg-surface-base border border-stroke rounded-lg">
          <h4 class="text-body-regular font-medium text-content-primary mb-2">With Value</h4>
          <p class="text-label text-content-secondary mb-3">Input with a selected or typed value.</p>
          <AxisAutocomplete
            model-value="Los Angeles"
            :options="cityOptions"
            label="City"
          />
        </div>

        <!-- Error -->
        <div class="p-4 bg-surface-base border border-stroke rounded-lg">
          <h4 class="text-body-regular font-medium text-content-primary mb-2">Error</h4>
          <p class="text-label text-content-secondary mb-3">Invalid state with error message.</p>
          <AxisAutocomplete
            v-model="autocompleteErrorValue"
            :options="cityOptions"
            label="City"
            error="Please select a valid city"
          />
        </div>

        <!-- Disabled -->
        <div class="p-4 bg-surface-base border border-stroke rounded-lg">
          <h4 class="text-body-regular font-medium text-content-primary mb-2">Disabled</h4>
          <p class="text-label text-content-secondary mb-3">Non-interactive state.</p>
          <AxisAutocomplete
            v-model="autocompleteDisabledValue"
            :options="cityOptions"
            label="City"
            disabled
          />
        </div>
      </div>
    </div>

    <!-- Autocomplete Sizes -->
    <div class="docs-section">
      <h3 class="text-h4 text-content-primary mb-2">Sizes</h3>
      <p class="text-body-regular text-content-secondary mb-4">
        Same sizes as AxisInput for consistent form layouts.
      </p>

      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="border-b border-stroke">
              <th class="py-2 pr-4 text-label-bold text-content-secondary">Size</th>
              <th class="py-2 pr-4 text-label-bold text-content-secondary">Height</th>
              <th class="py-2 text-label-bold text-content-secondary w-64">Example</th>
            </tr>
          </thead>
          <tbody class="text-body-regular text-content-secondary">
            <tr class="border-b border-stroke-subtle">
              <td class="py-3 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">sm</code></td>
              <td class="py-3 pr-4">28px</td>
              <td class="py-3"><AxisAutocomplete size="sm" :options="cityOptions" placeholder="Small" /></td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-3 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">md</code></td>
              <td class="py-3 pr-4">36px</td>
              <td class="py-3"><AxisAutocomplete size="md" :options="cityOptions" placeholder="Medium" /></td>
            </tr>
            <tr>
              <td class="py-3 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">lg</code></td>
              <td class="py-3 pr-4">44px</td>
              <td class="py-3"><AxisAutocomplete size="lg" :options="cityOptions" placeholder="Large" /></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Autocomplete API Reference -->
    <div class="docs-section">
      <h3 class="text-h4 text-content-primary mb-3">API Reference</h3>

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
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">v-model</code></td>
              <td class="py-2 pr-4 text-label">string</td>
              <td class="py-2 pr-4 text-label">''</td>
              <td class="py-2 text-label">Input value (two-way binding)</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">options</code></td>
              <td class="py-2 pr-4 text-label">AutocompleteOption[]</td>
              <td class="py-2 pr-4 text-label">[]</td>
              <td class="py-2 text-label">Array of { value, label, icon? } options</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">size</code></td>
              <td class="py-2 pr-4 text-label">'sm' | 'md' | 'lg'</td>
              <td class="py-2 pr-4 text-label">'md'</td>
              <td class="py-2 text-label">Input size</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">label</code></td>
              <td class="py-2 pr-4 text-label">string</td>
              <td class="py-2 pr-4 text-label">''</td>
              <td class="py-2 text-label">Label text above input</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">placeholder</code></td>
              <td class="py-2 pr-4 text-label">string</td>
              <td class="py-2 pr-4 text-label">''</td>
              <td class="py-2 text-label">Placeholder text</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">hint</code></td>
              <td class="py-2 pr-4 text-label">string</td>
              <td class="py-2 pr-4 text-label">''</td>
              <td class="py-2 text-label">Helper text below input</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">error</code></td>
              <td class="py-2 pr-4 text-label">string</td>
              <td class="py-2 pr-4 text-label">''</td>
              <td class="py-2 text-label">Error message (sets error state)</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">disabled</code></td>
              <td class="py-2 pr-4 text-label">boolean</td>
              <td class="py-2 pr-4 text-label">false</td>
              <td class="py-2 text-label">Disable the input</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">readonly</code></td>
              <td class="py-2 pr-4 text-label">boolean</td>
              <td class="py-2 pr-4 text-label">false</td>
              <td class="py-2 text-label">Make input read-only</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">required</code></td>
              <td class="py-2 pr-4 text-label">boolean</td>
              <td class="py-2 pr-4 text-label">false</td>
              <td class="py-2 text-label">Mark as required field</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">icon-left</code></td>
              <td class="py-2 pr-4 text-label">Component</td>
              <td class="py-2 pr-4 text-label">null</td>
              <td class="py-2 text-label">Icon component for left side</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">clearable</code></td>
              <td class="py-2 pr-4 text-label">boolean</td>
              <td class="py-2 pr-4 text-label">true</td>
              <td class="py-2 text-label">Show clear button when has value</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">maxVisibleOptions</code></td>
              <td class="py-2 pr-4 text-label">number</td>
              <td class="py-2 pr-4 text-label">6</td>
              <td class="py-2 text-label">Max options shown before scrolling</td>
            </tr>
            <tr>
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">minCharsForSuggestions</code></td>
              <td class="py-2 pr-4 text-label">number</td>
              <td class="py-2 pr-4 text-label">0</td>
              <td class="py-2 text-label">Min characters before showing suggestions</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Autocomplete Events -->
    <div class="docs-section">
      <h3 class="text-h4 text-content-primary mb-3">Events</h3>

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
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">update:modelValue</code></td>
              <td class="py-2 pr-4 text-label">string</td>
              <td class="py-2 text-label">Emitted when value changes (v-model)</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">select</code></td>
              <td class="py-2 pr-4 text-label">AutocompleteOption</td>
              <td class="py-2 text-label">Emitted when an option is selected from dropdown</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">focus</code></td>
              <td class="py-2 pr-4 text-label">FocusEvent</td>
              <td class="py-2 text-label">Emitted when input receives focus</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">blur</code></td>
              <td class="py-2 pr-4 text-label">FocusEvent</td>
              <td class="py-2 text-label">Emitted when input loses focus</td>
            </tr>
            <tr>
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">input</code></td>
              <td class="py-2 pr-4 text-label">Event</td>
              <td class="py-2 text-label">Emitted on each input event</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Autocomplete Accessibility -->
    <div class="docs-section">
      <h3 class="text-h4 text-content-primary mb-3">Accessibility</h3>

      <div class="space-y-4">
        <div class="p-4 bg-info-50 dark:bg-info-950 border border-info-200 dark:border-info-800 rounded-lg">
          <h4 class="text-body-regular font-medium text-info-900 dark:text-info-100 mb-2">Keyboard Navigation</h4>
          <ul class="text-label text-info-800 dark:text-info-300 space-y-1">
            <li><strong>↓ Arrow Down:</strong> Open dropdown / move to next option</li>
            <li><strong>↑ Arrow Up:</strong> Move to previous option</li>
            <li><strong>Enter:</strong> Select highlighted option</li>
            <li><strong>Escape:</strong> Close dropdown</li>
            <li><strong>Tab:</strong> Close dropdown and move focus</li>
          </ul>
        </div>

        <div class="p-4 bg-surface-raised border border-stroke rounded-lg">
          <h4 class="text-body-regular font-medium text-content-primary mb-2">ARIA Attributes</h4>
          <ul class="text-label text-content-secondary space-y-1">
            <li><code class="bg-surface-raised dark:bg-neutral-700 px-1 rounded">role="combobox"</code> - Input has combobox role</li>
            <li><code class="bg-surface-raised dark:bg-neutral-700 px-1 rounded">aria-autocomplete="list"</code> - Indicates autocomplete behavior</li>
            <li><code class="bg-surface-raised dark:bg-neutral-700 px-1 rounded">aria-expanded</code> - Indicates dropdown state</li>
            <li><code class="bg-surface-raised dark:bg-neutral-700 px-1 rounded">aria-controls</code> - Links to listbox element</li>
            <li><code class="bg-surface-raised dark:bg-neutral-700 px-1 rounded">role="listbox"</code> - Dropdown has listbox role</li>
            <li><code class="bg-surface-raised dark:bg-neutral-700 px-1 rounded">role="option"</code> - Each option in dropdown</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Autocomplete Code Examples -->
    <div class="docs-section-last">
      <h3 class="text-h4 text-content-primary mb-3">Code Examples</h3>

      <div class="space-y-4">
        <!-- Basic -->
        <div class="border border-stroke rounded-lg overflow-hidden">
          <div class="px-4 py-2 bg-surface-raised border-b border-stroke flex items-center justify-between">
            <span class="text-label-bold text-content-secondary">Basic Usage</span>
            <button
              class="text-label text-main-700 dark:text-main-400 hover:text-main-900 dark:hover:text-main-200"
              @click="copyToClipboard(codeExamples.autocompleteBasic)"
            >
              {{ copiedCode === codeExamples.autocompleteBasic ? 'Copied!' : 'Copy' }}
            </button>
          </div>
          <pre class="p-4 text-label bg-neutral-900 overflow-x-auto"><code class="text-neutral-100">{{ codeExamples.autocompleteBasic }}</code></pre>
        </div>

        <!-- With Icon -->
        <div class="border border-stroke rounded-lg overflow-hidden">
          <div class="px-4 py-2 bg-surface-raised border-b border-stroke flex items-center justify-between">
            <span class="text-label-bold text-content-secondary">With Icons</span>
            <button
              class="text-label text-main-700 dark:text-main-400 hover:text-main-900 dark:hover:text-main-200"
              @click="copyToClipboard(codeExamples.autocompleteWithIcon)"
            >
              {{ copiedCode === codeExamples.autocompleteWithIcon ? 'Copied!' : 'Copy' }}
            </button>
          </div>
          <pre class="p-4 text-label bg-neutral-900 overflow-x-auto"><code class="text-neutral-100">{{ codeExamples.autocompleteWithIcon }}</code></pre>
        </div>

        <!-- Min Characters -->
        <div class="border border-stroke rounded-lg overflow-hidden">
          <div class="px-4 py-2 bg-surface-raised border-b border-stroke flex items-center justify-between">
            <span class="text-label-bold text-content-secondary">Minimum Characters Before Suggestions</span>
            <button
              class="text-label text-main-700 dark:text-main-400 hover:text-main-900 dark:hover:text-main-200"
              @click="copyToClipboard(codeExamples.autocompleteMinChars)"
            >
              {{ copiedCode === codeExamples.autocompleteMinChars ? 'Copied!' : 'Copy' }}
            </button>
          </div>
          <pre class="p-4 text-label bg-neutral-900 overflow-x-auto"><code class="text-neutral-100">{{ codeExamples.autocompleteMinChars }}</code></pre>
        </div>
      </div>
    </div>
  </div>
</template>
