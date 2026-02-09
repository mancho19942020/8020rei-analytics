<script setup lang="ts">
/**
 * Button Group Documentation Page
 * Design System - Axis Components
 */
import { ref } from 'vue'
import { Squares2X2Icon, Bars3Icon, MapIcon } from '@heroicons/vue/24/outline'

definePageMeta({
  layout: "design-system",
});

useHead({
  title: "Button Group | Design System | 8020",
});

// Demo state
const selectedView = ref('grid')
const selectedSort = ref('name')
const selectedFilters = ref<string[]>([])

// Options for demos
const viewOptions = [
  { value: 'grid', label: 'Grid', icon: Squares2X2Icon },
  { value: 'list', label: 'List', icon: Bars3Icon },
  { value: 'map', label: 'Map', icon: MapIcon },
]

const iconOnlyOptions = [
  { value: 'grid', icon: Squares2X2Icon },
  { value: 'list', icon: Bars3Icon },
  { value: 'map', icon: MapIcon },
]

const sortOptions = [
  { value: 'name', label: 'Name' },
  { value: 'date', label: 'Date' },
  { value: 'size', label: 'Size' },
]

const filterOptions = [
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'archived', label: 'Archived' },
]

const disabledOptions = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2', disabled: true },
  { value: 'option3', label: 'Option 3' },
]

// Size demos
const selectedSmall = ref('a')
const selectedMedium = ref('a')
const selectedLarge = ref('a')

const sizeOptions = [
  { value: 'a', label: 'Option A' },
  { value: 'b', label: 'Option B' },
  { value: 'c', label: 'Option C' },
]
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-h1 text-content-primary mb-2">Button Group</h1>
      <p class="text-body-large text-content-secondary">
        A group of buttons for selecting between related options within the same view.
        Use for filters, modes, or adjustments that modify the current display without navigation.
      </p>
    </div>

    <!-- Overview -->
    <section class="mb-12">
      <h2 class="text-h2 text-content-primary mb-4">Overview</h2>
      <p class="text-body-regular text-content-secondary mb-6">
        Button Groups allow users to choose between related actions or states within the same component.
        Unlike Navigation Tabs which change the entire content area, Button Groups typically filter,
        sort, or adjust the current view.
      </p>

      <div class="p-6 bg-surface-raised rounded-lg border border-stroke-subtle">
        <div class="flex flex-col items-center gap-4">
          <AxisButtonGroup
            v-model="selectedView"
            :options="viewOptions"
            aria-label="View selection"
          />
          <p class="text-body-regular text-content-secondary">
            Selected: <span class="font-medium text-content-primary">{{ selectedView }}</span>
          </p>
        </div>
      </div>
    </section>

    <!-- When to Use -->
    <section class="mb-12">
      <h2 class="text-h2 text-content-primary mb-4">When to Use</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Do's -->
        <div>
          <h3 class="text-h5 text-success-700 dark:text-success-400 mb-3">Do</h3>
          <ul class="space-y-2 text-body-regular text-content-secondary">
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1 shrink-0">&#x2713;</span>
              <span>Toggle between view modes (grid/list/map)</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1 shrink-0">&#x2713;</span>
              <span>Switch sorting options (name/date/size)</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1 shrink-0">&#x2713;</span>
              <span>Filter data within the same view</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1 shrink-0">&#x2713;</span>
              <span>Toggle data units (USD/EUR, miles/km)</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1 shrink-0">&#x2713;</span>
              <span>Actions that modify the current display</span>
            </li>
          </ul>
        </div>

        <!-- Don'ts -->
        <div>
          <h3 class="text-h5 text-error-700 dark:text-error-400 mb-3">Don't</h3>
          <ul class="space-y-2 text-body-regular text-content-secondary">
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1 shrink-0">&#x2717;</span>
              <span>Navigate to different pages or sections</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1 shrink-0">&#x2717;</span>
              <span>Replace content entirely (use Navigation Tabs)</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1 shrink-0">&#x2717;</span>
              <span>More than 5 options (consider dropdown)</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1 shrink-0">&#x2717;</span>
              <span>Unrelated actions in the same group</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1 shrink-0">&#x2717;</span>
              <span>Primary form submission actions</span>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Variants -->
    <section class="mb-12">
      <h2 class="text-h2 text-content-primary mb-4">Variants</h2>

      <!-- Single Selection -->
      <div class="mb-8">
        <h3 class="text-h3 text-content-primary mb-3">Single Selection (Default)</h3>
        <p class="text-body-regular text-content-secondary mb-4">
          Only one option can be selected at a time. Use for mutually exclusive choices.
        </p>
        <div class="p-6 bg-surface-raised rounded-lg border border-stroke-subtle">
          <AxisButtonGroup
            v-model="selectedSort"
            :options="sortOptions"
            aria-label="Sort selection"
          />
        </div>
      </div>

      <!-- Multiple Selection -->
      <div class="mb-8">
        <h3 class="text-h3 text-content-primary mb-3">Multiple Selection</h3>
        <p class="text-body-regular text-content-secondary mb-4">
          Multiple options can be selected simultaneously. Use for filter combinations.
        </p>
        <div class="p-6 bg-surface-raised rounded-lg border border-stroke-subtle">
          <div class="flex flex-col items-start gap-4">
            <AxisButtonGroup
              v-model="selectedFilters"
              :options="filterOptions"
              multiple
              aria-label="Filter selection"
            />
            <p class="text-body-regular text-content-secondary">
              Selected: <span class="font-medium text-content-primary">{{ selectedFilters.length > 0 ? selectedFilters.join(', ') : 'None' }}</span>
            </p>
          </div>
        </div>
      </div>

      <!-- Icon Only -->
      <div class="mb-8">
        <h3 class="text-h3 text-content-primary mb-3">Icon Only</h3>
        <p class="text-body-regular text-content-secondary mb-4">
          Compact buttons with only icons. Ensure icons are recognizable and provide accessible labels.
        </p>
        <div class="p-6 bg-surface-raised rounded-lg border border-stroke-subtle">
          <AxisButtonGroup
            v-model="selectedView"
            :options="iconOnlyOptions"
            aria-label="View mode"
          />
        </div>
      </div>

      <!-- With Icons and Labels -->
      <div class="mb-8">
        <h3 class="text-h3 text-content-primary mb-3">Icons with Labels</h3>
        <p class="text-body-regular text-content-secondary mb-4">
          Combines icons and text for maximum clarity.
        </p>
        <div class="p-6 bg-surface-raised rounded-lg border border-stroke-subtle">
          <AxisButtonGroup
            v-model="selectedView"
            :options="viewOptions"
            aria-label="View selection"
          />
        </div>
      </div>
    </section>

    <!-- Sizes -->
    <section class="mb-12">
      <h2 class="text-h2 text-content-primary mb-4">Sizes</h2>
      <p class="text-body-regular text-content-secondary mb-6">
        Three sizes available to fit different UI contexts and hierarchy needs.
      </p>

      <div class="space-y-6">
        <!-- Small -->
        <div class="p-6 bg-surface-raised rounded-lg border border-stroke-subtle">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-h4 text-content-primary mb-1">Small (28px)</h3>
              <p class="text-body-regular text-content-secondary">Compact spaces, toolbars</p>
            </div>
            <AxisButtonGroup
              v-model="selectedSmall"
              :options="sizeOptions"
              size="sm"
              aria-label="Small button group"
            />
          </div>
        </div>

        <!-- Medium -->
        <div class="p-6 bg-surface-raised rounded-lg border border-stroke-subtle">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-h4 text-content-primary mb-1">Medium (36px) - Default</h3>
              <p class="text-body-regular text-content-secondary">Standard use cases</p>
            </div>
            <AxisButtonGroup
              v-model="selectedMedium"
              :options="sizeOptions"
              size="md"
              aria-label="Medium button group"
            />
          </div>
        </div>

        <!-- Large -->
        <div class="p-6 bg-surface-raised rounded-lg border border-stroke-subtle">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-h4 text-content-primary mb-1">Large (44px)</h3>
              <p class="text-body-regular text-content-secondary">Prominent controls, hero sections</p>
            </div>
            <AxisButtonGroup
              v-model="selectedLarge"
              :options="sizeOptions"
              size="lg"
              aria-label="Large button group"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- States -->
    <section class="mb-12">
      <h2 class="text-h2 text-content-primary mb-4">States</h2>

      <div class="grid md:grid-cols-2 gap-6">
        <!-- Disabled Option -->
        <div class="p-6 bg-surface-raised rounded-lg border border-stroke-subtle">
          <h3 class="text-h4 text-content-primary mb-3">Disabled Option</h3>
          <p class="text-body-regular text-content-secondary mb-4">
            Individual options can be disabled while others remain interactive.
          </p>
          <AxisButtonGroup
            v-model="selectedSort"
            :options="disabledOptions"
            aria-label="Group with disabled option"
          />
        </div>

        <!-- Disabled Group -->
        <div class="p-6 bg-surface-raised rounded-lg border border-stroke-subtle">
          <h3 class="text-h4 text-content-primary mb-3">Disabled Group</h3>
          <p class="text-body-regular text-content-secondary mb-4">
            The entire group can be disabled when the feature is unavailable.
          </p>
          <AxisButtonGroup
            v-model="selectedSort"
            :options="sortOptions"
            disabled
            aria-label="Disabled button group"
          />
        </div>
      </div>
    </section>

    <!-- Full Width -->
    <section class="mb-12">
      <h2 class="text-h2 text-content-primary mb-4">Full Width</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Buttons can expand to fill the container width equally.
      </p>
      <div class="p-6 bg-surface-raised rounded-lg border border-stroke-subtle">
        <AxisButtonGroup
          v-model="selectedSort"
          :options="sortOptions"
          full-width
          aria-label="Full width button group"
        />
      </div>
    </section>

    <!-- API Reference -->
    <section class="mb-12">
      <h2 class="text-h2 text-content-primary mb-4">API Reference</h2>

      <!-- Props -->
      <div class="mb-8">
        <h3 class="text-h3 text-content-primary mb-4">Props</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-stroke">
                <th class="py-3 pr-4 text-body-regular font-semibold text-content-primary">Prop</th>
                <th class="py-3 pr-4 text-body-regular font-semibold text-content-primary">Type</th>
                <th class="py-3 pr-4 text-body-regular font-semibold text-content-primary">Default</th>
                <th class="py-3 text-body-regular font-semibold text-content-primary">Description</th>
              </tr>
            </thead>
            <tbody class="text-body-regular text-content-secondary">
              <tr class="border-b border-stroke-subtle">
                <td class="py-3 pr-4 font-mono text-label">modelValue</td>
                <td class="py-3 pr-4 font-mono text-label">string | number | array</td>
                <td class="py-3 pr-4">Required</td>
                <td class="py-3">Selected value(s)</td>
              </tr>
              <tr class="border-b border-stroke-subtle">
                <td class="py-3 pr-4 font-mono text-label">options</td>
                <td class="py-3 pr-4 font-mono text-label">ButtonOption[]</td>
                <td class="py-3 pr-4">Required</td>
                <td class="py-3">Array of options with value, label, icon, disabled</td>
              </tr>
              <tr class="border-b border-stroke-subtle">
                <td class="py-3 pr-4 font-mono text-label">size</td>
                <td class="py-3 pr-4 font-mono text-label">'sm' | 'md' | 'lg'</td>
                <td class="py-3 pr-4">'md'</td>
                <td class="py-3">Button size variant</td>
              </tr>
              <tr class="border-b border-stroke-subtle">
                <td class="py-3 pr-4 font-mono text-label">multiple</td>
                <td class="py-3 pr-4 font-mono text-label">boolean</td>
                <td class="py-3 pr-4">false</td>
                <td class="py-3">Allow multiple selection</td>
              </tr>
              <tr class="border-b border-stroke-subtle">
                <td class="py-3 pr-4 font-mono text-label">disabled</td>
                <td class="py-3 pr-4 font-mono text-label">boolean</td>
                <td class="py-3 pr-4">false</td>
                <td class="py-3">Disable the entire group</td>
              </tr>
              <tr class="border-b border-stroke-subtle">
                <td class="py-3 pr-4 font-mono text-label">fullWidth</td>
                <td class="py-3 pr-4 font-mono text-label">boolean</td>
                <td class="py-3 pr-4">false</td>
                <td class="py-3">Buttons fill container equally</td>
              </tr>
              <tr class="border-b border-stroke-subtle">
                <td class="py-3 pr-4 font-mono text-label">ariaLabel</td>
                <td class="py-3 pr-4 font-mono text-label">string</td>
                <td class="py-3 pr-4">'Button group'</td>
                <td class="py-3">Accessible label for the group</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ButtonOption Interface -->
      <div class="mb-8">
        <h3 class="text-h3 text-content-primary mb-4">ButtonOption Interface</h3>
        <div class="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg font-mono text-label">
          <pre class="text-content-secondary">interface ButtonOption {
  value: string | number   // Unique identifier
  label?: string           // Display text
  icon?: Component         // Icon component
  disabled?: boolean       // Disable this option
}</pre>
        </div>
      </div>
    </section>

    <!-- Accessibility -->
    <section class="mb-12">
      <h2 class="text-h2 text-content-primary mb-4">Accessibility</h2>
      <ul class="space-y-3 text-body-regular text-content-secondary">
        <li class="flex items-start gap-2">
          <svg class="w-5 h-5 text-success-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Uses <code class="px-1 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-label">role="group"</code> with descriptive <code class="px-1 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-label">aria-label</code>
        </li>
        <li class="flex items-start gap-2">
          <svg class="w-5 h-5 text-success-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Selected state communicated via <code class="px-1 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-label">aria-pressed</code>
        </li>
        <li class="flex items-start gap-2">
          <svg class="w-5 h-5 text-success-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Keyboard accessible - Tab to focus, Enter/Space to select
        </li>
        <li class="flex items-start gap-2">
          <svg class="w-5 h-5 text-success-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Focus ring visible with <code class="px-1 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-label">focus-visible:ring-2</code>
        </li>
        <li class="flex items-start gap-2">
          <svg class="w-5 h-5 text-success-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Disabled buttons have <code class="px-1 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-label">disabled</code> attribute and visual styling
        </li>
      </ul>
    </section>
  </div>
</template>
