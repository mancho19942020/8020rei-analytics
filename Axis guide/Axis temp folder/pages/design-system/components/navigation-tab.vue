<script setup lang="ts">
/**
 * Navigation Tab Documentation Page
 * Design System - Axis Components
 */
import { ref } from 'vue'
import { HomeIcon, UserIcon, Cog6ToothIcon, BellIcon } from '@heroicons/vue/24/outline'

definePageMeta({
  layout: "design-system",
});

useHead({
  title: "Navigation Tab | Design System | 8020",
});

// Demo state
const activeTab = ref('overview')
const activeContained = ref('details')
const activeWithBadge = ref('notifications')
const activeOptions = ref('tab1')

// Options menu state
const showOptionsMenu = ref(false)
const selectedTabForOptions = ref<string | null>(null)

// Handle options menu click
const handleTabOptions = (tabId: string) => {
  selectedTabForOptions.value = tabId
  showOptionsMenu.value = true

  // Auto-close after 3 seconds
  setTimeout(() => {
    showOptionsMenu.value = false
  }, 3000)
}

// Tab configurations
const basicTabs = [
  { id: 'overview', name: 'Overview' },
  { id: 'details', name: 'Details' },
  { id: 'activity', name: 'Activity' },
]

const iconTabs = [
  { id: 'home', name: 'Home', icon: HomeIcon },
  { id: 'profile', name: 'Profile', icon: UserIcon },
  { id: 'settings', name: 'Settings', icon: Cog6ToothIcon },
]

const badgeTabs = [
  { id: 'messages', name: 'Messages', badge: 5 },
  { id: 'notifications', name: 'Notifications', badge: 12 },
  { id: 'updates', name: 'Updates', badge: '99+' },
]

const disabledTabs = [
  { id: 'available', name: 'Available' },
  { id: 'disabled', name: 'Coming Soon', disabled: true },
  { id: 'active', name: 'Active' },
]

const optionsTabs = [
  { id: 'tab1', name: 'Tab 1', hasOptions: true },
  { id: 'tab2', name: 'Tab 2', hasOptions: true },
  { id: 'tab3', name: 'Tab 3', hasOptions: true },
]

const pinnedTabs = [
  { id: 'pinned1', name: 'High Value', pinned: true },
  { id: 'pinned2', name: 'Favorites', pinned: true },
]

// Pinned tabs demo state
const activePinned = ref('pinned1')

// Size demos
const activeSmall = ref('tab1')
const activeMedium = ref('tab1')

const sizeTabs = [
  { id: 'tab1', name: 'First Tab' },
  { id: 'tab2', name: 'Second Tab' },
  { id: 'tab3', name: 'Third Tab' },
]
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-h1 text-content-primary mb-2">Navigation Tab</h1>
      <p class="text-body-large text-content-secondary">
        Tab navigation for switching between different sections or views within the same screen.
        Use when content completely changes between tabs.
      </p>
    </div>

    <!-- Overview -->
    <section class="mb-12">
      <h2 class="text-h2 text-content-primary mb-4">Overview</h2>
      <p class="text-body-regular text-content-secondary mb-6">
        Navigation Tabs allow users to navigate between different sections or views within the same screen.
        Each tab represents distinct content that replaces the current view entirely.
      </p>

      <div class="p-6 bg-surface-raised rounded-lg border border-stroke-subtle">
        <AxisNavigationTab
          v-model="activeTab"
          :tabs="basicTabs"
          aria-label="Main navigation"
        />
        <div class="mt-6 p-4 bg-surface-base rounded border border-stroke-subtle">
          <p class="text-body-regular text-content-secondary">
            Content for: <span class="font-medium text-content-primary">{{ activeTab }}</span>
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
              <span>Navigate between distinct views (All / For Sale / Sold)</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1 shrink-0">&#x2713;</span>
              <span>Content completely changes between tabs</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1 shrink-0">&#x2713;</span>
              <span>Each tab represents a sub-section or category</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1 shrink-0">&#x2713;</span>
              <span>Users explore or compare different data sets</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1 shrink-0">&#x2713;</span>
              <span>Property list views (All Properties, Active, Pending)</span>
            </li>
          </ul>
        </div>

        <!-- Don'ts -->
        <div>
          <h3 class="text-h5 text-error-700 dark:text-error-400 mb-3">Don't</h3>
          <ul class="space-y-2 text-body-regular text-content-secondary">
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1 shrink-0">&#x2717;</span>
              <span>Toggle display modes (use Button Group instead)</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1 shrink-0">&#x2717;</span>
              <span>Filter the same data (use Button Group)</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1 shrink-0">&#x2717;</span>
              <span>More than 6 tabs (consider different navigation)</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1 shrink-0">&#x2717;</span>
              <span>Nested tabs within tabs</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1 shrink-0">&#x2717;</span>
              <span>Sort or adjust current view (use Button Group)</span>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Variants -->
    <section class="mb-12">
      <h2 class="text-h2 text-content-primary mb-4">Variants</h2>

      <!-- Line Variant -->
      <div class="mb-8">
        <h3 class="text-h3 text-content-primary mb-3">Line (Default)</h3>
        <p class="text-body-regular text-content-secondary mb-4">
          Underline indicator for selected tab. Clean and minimal, ideal for most use cases.
        </p>
        <div class="p-6 bg-surface-raised rounded-lg border border-stroke-subtle">
          <AxisNavigationTab
            v-model="activeTab"
            :tabs="basicTabs"
            variant="line"
            aria-label="Line variant tabs"
          />
        </div>
      </div>

      <!-- Contained Variant -->
      <div class="mb-8">
        <h3 class="text-h3 text-content-primary mb-3">Contained</h3>
        <p class="text-body-regular text-content-secondary mb-4">
          Pill/badge style background for selected tab. More prominent visual distinction.
        </p>
        <div class="p-6 bg-surface-raised rounded-lg border border-stroke-subtle">
          <AxisNavigationTab
            v-model="activeContained"
            :tabs="basicTabs"
            variant="contained"
            aria-label="Contained variant tabs"
          />
        </div>
      </div>

      <!-- With Icons -->
      <div class="mb-8">
        <h3 class="text-h3 text-content-primary mb-3">With Icons</h3>
        <p class="text-body-regular text-content-secondary mb-4">
          Icons can enhance recognition and visual hierarchy.
        </p>
        <div class="p-6 bg-surface-raised rounded-lg border border-stroke-subtle">
          <AxisNavigationTab
            v-model="activeTab"
            :tabs="iconTabs"
            aria-label="Tabs with icons"
          />
        </div>
      </div>

      <!-- With Badges -->
      <div class="mb-8">
        <h3 class="text-h3 text-content-primary mb-3">With Badges</h3>
        <p class="text-body-regular text-content-secondary mb-4">
          Badges show counts or status indicators for each tab's content.
        </p>
        <div class="p-6 bg-surface-raised rounded-lg border border-stroke-subtle">
          <AxisNavigationTab
            v-model="activeWithBadge"
            :tabs="badgeTabs"
            aria-label="Tabs with badges"
          />
        </div>
      </div>
    </section>

    <!-- Sizes -->
    <section class="mb-12">
      <h2 class="text-h2 text-content-primary mb-4">Sizes</h2>
      <p class="text-body-regular text-content-secondary mb-6">
        Two sizes available based on context and visual hierarchy.
      </p>

      <div class="space-y-6">
        <!-- Small -->
        <div class="p-6 bg-surface-raised rounded-lg border border-stroke-subtle">
          <div class="mb-4">
            <h3 class="text-h4 text-content-primary mb-1">Small (36px)</h3>
            <p class="text-body-regular text-content-secondary">Compact spaces, secondary navigation</p>
          </div>
          <AxisNavigationTab
            v-model="activeSmall"
            :tabs="sizeTabs"
            size="sm"
            aria-label="Small tabs"
          />
        </div>

        <!-- Medium -->
        <div class="p-6 bg-surface-raised rounded-lg border border-stroke-subtle">
          <div class="mb-4">
            <h3 class="text-h4 text-content-primary mb-1">Medium (52px) - Default</h3>
            <p class="text-body-regular text-content-secondary">Primary navigation, main content areas</p>
          </div>
          <AxisNavigationTab
            v-model="activeMedium"
            :tabs="sizeTabs"
            size="md"
            aria-label="Medium tabs"
          />
        </div>
      </div>
    </section>

    <!-- States -->
    <section class="mb-12">
      <h2 class="text-h2 text-content-primary mb-4">States</h2>

      <div class="grid md:grid-cols-2 gap-6">
        <!-- Disabled Tab -->
        <div class="p-6 bg-surface-raised rounded-lg border border-stroke-subtle">
          <h3 class="text-h4 text-content-primary mb-3">Disabled Tab</h3>
          <p class="text-body-regular text-content-secondary mb-4">
            Individual tabs can be disabled for unavailable content.
          </p>
          <AxisNavigationTab
            v-model="activeTab"
            :tabs="disabledTabs"
            aria-label="Tabs with disabled option"
          />
        </div>

        <!-- Pinned Tabs -->
        <div class="p-6 bg-surface-raised rounded-lg border border-stroke-subtle">
          <h3 class="text-h4 text-content-primary mb-3">Pinned Indicator</h3>
          <p class="text-body-regular text-content-secondary mb-4">
            Tabs can display a pin icon to indicate saved/favorited items. Useful for saved views.
          </p>
          <AxisNavigationTab
            v-model="activePinned"
            :tabs="pinnedTabs"
            aria-label="Tabs with pinned indicator"
          />
        </div>

        <!-- With Options Menu -->
        <div class="p-6 bg-surface-raised rounded-lg border border-stroke-subtle relative md:col-span-2">
          <h3 class="text-h4 text-content-primary mb-3">With Options Menu</h3>
          <p class="text-body-regular text-content-secondary mb-4">
            Tabs can include an options indicator for additional actions. Click the 3-dot menu to see demo.
          </p>
          <AxisNavigationTab
            v-model="activeOptions"
            :tabs="optionsTabs"
            aria-label="Tabs with options"
            @tab-options="handleTabOptions"
          />

          <!-- Demo Options Menu -->
          <Transition
            enter-active-class="transition ease-out duration-100"
            enter-from-class="transform opacity-0 scale-95"
            enter-to-class="transform opacity-100 scale-100"
            leave-active-class="transition ease-in duration-75"
            leave-from-class="transform opacity-100 scale-100"
            leave-to-class="transform opacity-0 scale-95"
          >
            <div
              v-if="showOptionsMenu"
              class="absolute z-10 mt-2 w-48 rounded-lg bg-white dark:bg-neutral-800 shadow-lg ring-1 ring-black ring-opacity-5 left-0 top-full"
            >
              <div class="p-1">
                <button
                  class="w-full text-left px-3 py-2 text-body-regular text-content-primary hover:bg-neutral-50 dark:hover:bg-neutral-700 rounded transition-colors"
                  @click="showOptionsMenu = false"
                >
                  Rename {{ selectedTabForOptions }}
                </button>
                <button
                  class="w-full text-left px-3 py-2 text-body-regular text-content-primary hover:bg-neutral-50 dark:hover:bg-neutral-700 rounded transition-colors"
                  @click="showOptionsMenu = false"
                >
                  Duplicate
                </button>
                <button
                  class="w-full text-left px-3 py-2 text-body-regular text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-950 rounded transition-colors"
                  @click="showOptionsMenu = false"
                >
                  Delete
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </section>

    <!-- Full Width -->
    <section class="mb-12">
      <h2 class="text-h2 text-content-primary mb-4">Full Width</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Tabs can expand to fill the container width equally.
      </p>
      <div class="p-6 bg-surface-raised rounded-lg border border-stroke-subtle">
        <AxisNavigationTab
          v-model="activeTab"
          :tabs="basicTabs"
          full-width
          aria-label="Full width tabs"
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
                <td class="py-3 pr-4 font-mono text-label">string</td>
                <td class="py-3 pr-4">Required</td>
                <td class="py-3">Currently selected tab ID</td>
              </tr>
              <tr class="border-b border-stroke-subtle">
                <td class="py-3 pr-4 font-mono text-label">tabs</td>
                <td class="py-3 pr-4 font-mono text-label">Tab[]</td>
                <td class="py-3 pr-4">Required</td>
                <td class="py-3">Array of tab objects</td>
              </tr>
              <tr class="border-b border-stroke-subtle">
                <td class="py-3 pr-4 font-mono text-label">variant</td>
                <td class="py-3 pr-4 font-mono text-label">'line' | 'contained'</td>
                <td class="py-3 pr-4">'line'</td>
                <td class="py-3">Visual variant</td>
              </tr>
              <tr class="border-b border-stroke-subtle">
                <td class="py-3 pr-4 font-mono text-label">size</td>
                <td class="py-3 pr-4 font-mono text-label">'sm' | 'md'</td>
                <td class="py-3 pr-4">'md'</td>
                <td class="py-3">Tab size</td>
              </tr>
              <tr class="border-b border-stroke-subtle">
                <td class="py-3 pr-4 font-mono text-label">fullWidth</td>
                <td class="py-3 pr-4 font-mono text-label">boolean</td>
                <td class="py-3 pr-4">false</td>
                <td class="py-3">Tabs fill container equally</td>
              </tr>
              <tr class="border-b border-stroke-subtle">
                <td class="py-3 pr-4 font-mono text-label">ariaLabel</td>
                <td class="py-3 pr-4 font-mono text-label">string</td>
                <td class="py-3 pr-4">'Navigation tabs'</td>
                <td class="py-3">Accessible label for tab list</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Tab Interface -->
      <div class="mb-8">
        <h3 class="text-h3 text-content-primary mb-4">Tab Interface</h3>
        <div class="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg font-mono text-label">
          <pre class="text-content-secondary">interface Tab {
  id: string              // Unique identifier
  name: string            // Display name
  icon?: Component        // Optional icon
  disabled?: boolean      // Disable this tab
  hasOptions?: boolean    // Show options indicator
  badge?: number | string // Badge count/text
  pinned?: boolean        // Show pinned indicator (pin icon)
}</pre>
        </div>
      </div>

      <!-- Events -->
      <div class="mb-8">
        <h3 class="text-h3 text-content-primary mb-4">Events</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-stroke">
                <th class="py-3 pr-4 text-body-regular font-semibold text-content-primary">Event</th>
                <th class="py-3 pr-4 text-body-regular font-semibold text-content-primary">Payload</th>
                <th class="py-3 text-body-regular font-semibold text-content-primary">Description</th>
              </tr>
            </thead>
            <tbody class="text-body-regular text-content-secondary">
              <tr class="border-b border-stroke-subtle">
                <td class="py-3 pr-4 font-mono text-label">update:modelValue</td>
                <td class="py-3 pr-4 font-mono text-label">string</td>
                <td class="py-3">Emitted when a tab is selected</td>
              </tr>
              <tr class="border-b border-stroke-subtle">
                <td class="py-3 pr-4 font-mono text-label">tab-options</td>
                <td class="py-3 pr-4 font-mono text-label">string (tabId)</td>
                <td class="py-3">Emitted when options button is clicked</td>
              </tr>
            </tbody>
          </table>
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
          Uses <code class="px-1 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-label">role="tablist"</code> with descriptive <code class="px-1 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-label">aria-label</code>
        </li>
        <li class="flex items-start gap-2">
          <svg class="w-5 h-5 text-success-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Each tab has <code class="px-1 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-label">role="tab"</code> with <code class="px-1 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-label">aria-selected</code>
        </li>
        <li class="flex items-start gap-2">
          <svg class="w-5 h-5 text-success-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Keyboard navigation: Arrow keys to move, Enter/Space to select
        </li>
        <li class="flex items-start gap-2">
          <svg class="w-5 h-5 text-success-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Home/End keys jump to first/last tab
        </li>
        <li class="flex items-start gap-2">
          <svg class="w-5 h-5 text-success-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Roving tabindex pattern for efficient keyboard navigation
        </li>
        <li class="flex items-start gap-2">
          <svg class="w-5 h-5 text-success-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Disabled tabs have <code class="px-1 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-label">aria-disabled="true"</code>
        </li>
      </ul>
    </section>
  </div>
</template>
