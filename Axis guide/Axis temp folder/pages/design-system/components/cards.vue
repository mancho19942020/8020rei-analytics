<script setup lang="ts">
import {
  ArrowRightIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  HomeIcon,
  UserGroupIcon,
  BoltIcon,
  DocumentTextIcon,
  PhotoIcon,
  DocumentDuplicateIcon,
  TableCellsIcon,
} from "@heroicons/vue/24/outline";

definePageMeta({
  layout: "design-system",
});

useHead({
  title: "Cards | Components | Design System | 8020",
});

// ============================================
// CARD SPECIFICATION - AXIS DESIGN SYSTEM
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

// Demo states
const selectedPlan = ref<string | null>(null);
const selectedFeatures = ref<string[]>([]);

// Mock data for examples
const statItems = [
  { label: "Total Properties", value: "12,456", secondaryValue: "+12.5%", color: "success" as const },
  { label: "Active Deals", value: "847", secondaryValue: "-3.2%", color: "error" as const },
  { label: "Revenue", value: "$1.2M", secondaryValue: "+8.7%", color: "main" as const },
];

const planOptions = [
  { id: "starter", name: "Starter", price: "$29/mo", description: "Perfect for small teams getting started" },
  { id: "pro", name: "Professional", price: "$99/mo", description: "For growing businesses with advanced needs" },
  { id: "enterprise", name: "Enterprise", price: "Custom", description: "Tailored solutions for large organizations" },
];

const featureOptions = [
  { id: "analytics", name: "Advanced Analytics", description: "Deep insights into your data" },
  { id: "export", name: "Data Export", description: "Export to CSV, Excel, PDF" },
  { id: "api", name: "API Access", description: "Full REST API integration" },
];

// Image variant - with number identifier
const onboardingImageNumber = [
  {
    step: 1,
    title: "Connect Your Data Source",
    description: "Import your property data from CSV, Excel, or connect directly to your CRM. Our system supports multiple data formats for seamless integration.",
    supportText: "Supported formats: CSV, XLSX, JSON",
    state: "completed" as const,
  },
  {
    step: 2,
    title: "Configure Import Settings",
    description: "Set up your field mappings and configure how data should be processed. Match your columns to our standardized property fields.",
    supportText: "Average setup time: 5-10 minutes",
    state: "active" as const,
  },
  {
    step: 3,
    title: "Review and Confirm",
    description: "Preview your imported data and validate that everything looks correct before finalizing the import process.",
    supportText: "Changes can be made after import",
    state: "default" as const,
  },
  {
    step: 4,
    title: "Not Yet Available",
    description: "This step will become available after completing the previous steps in the onboarding process.",
    supportText: "Complete previous steps first",
    state: "non-completed" as const,
  },
];

// Table variant - for property import format instruction
const tableOnboardingExamples = [
  {
    tag: "CSV Format",
    title: "Property Import Format",
    description: "Your CSV file must follow this exact column structure. The first row should contain the column headers exactly as shown.",
    supportText: "Maximum file size: 50MB",
    state: "default" as const,
  },
  {
    tag: "Excel Format",
    title: "Spreadsheet Import Guide",
    description: "When using Excel files, ensure data is in the first sheet. Multiple sheets are not supported in this version.",
    supportText: "Use .xlsx format (not .xls)",
    state: "active" as const,
  },
];

// User variant examples
const userExamples = [
  {
    avatarSrc: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    userName: "German Alvarez",
    userEmail: "german@8020rei.com",
    userRole: "Superadmin",
    userStatus: "active" as const,
  },
  {
    avatarSrc: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    userName: "John Smith",
    userEmail: "john.smith@example.com",
    userRole: "Client User",
    userStatus: "active" as const,
  },
  {
    userName: "Sarah Johnson",
    userEmail: "sarah.j@company.com",
    userRole: "Client Admin",
    userStatus: "pending" as const,
  },
  {
    avatarSrc: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    userName: "Emily Davis",
    userEmail: "emily.davis@corp.io",
    userRole: "Internal",
    userStatus: "inactive" as const,
  },
];

// Code examples
const codeExamples = {
  base: `<AxisCard>
  <template #header>
    <AxisCardHeader title="Card Title" subtitle="Optional subtitle" />
  </template>

  <p>Card body content goes here.</p>

  <template #footer>
    <AxisCardFooter>
      <AxisButton variant="ghost" size="sm">Cancel</AxisButton>
      <AxisButton size="sm">Save</AxisButton>
    </AxisCardFooter>
  </template>
</AxisCard>`,

  stat: `<AxisCard
  variant="stat"
  label="Total Revenue"
  value="$123,456"
  secondary-value="+12.5%"
  color="success"
  :icon="CurrencyDollarIcon"
/>

<!-- With progress bar -->
<AxisCard
  variant="stat"
  display="bar"
  label="Completion"
  value="75%"
  :progress="75"
  color="main"
/>

<!-- With donut chart -->
<AxisCard
  variant="stat"
  display="donut"
  label="Used Storage"
  value="7.5 GB"
  :progress="75"
/>`,

  action: `<AxisCard
  variant="action"
  title="Add Property"
  description="Search and add new properties to your portfolio"
  :icon="HomeIcon"
  action-label="Add"
  :action-icon="ArrowRightIcon"
  @action="handleAction"
/>`,

  selectable: `<AxisCardGroup v-model="selectedPlan" name="plan">
  <AxisCard
    v-for="plan in plans"
    :key="plan.id"
    variant="selectable"
    :label="plan.name"
    :selection-value="plan.id"
  >
    <p class="text-content-secondary">{{ plan.description }}</p>
  </AxisCard>
</AxisCardGroup>

<!-- Checkbox group (multiple selection) -->
<AxisCardGroup v-model="selectedFeatures" multiple name="features">
  <AxisCard
    v-for="feature in features"
    :key="feature.id"
    variant="selectable"
    selection-type="checkbox"
    :label="feature.name"
    :selection-value="feature.id"
  />
</AxisCardGroup>`,

  onboarding: `<!-- Image variant with number identifier -->
<AxisCard
  variant="onboarding"
  visual-support="image"
  identifier-type="number"
  :step="1"
  title="Connect Your Data"
  description="Import your property data from various sources"
  support-text="Supported formats: CSV, XLSX, JSON"
  state="active"
  action-label="Get Started"
  :action-icon="ArrowRightIcon"
  media-src="/images/onboarding-step1.png"
  @action="startOnboarding"
/>

<!-- Image variant with tag identifier -->
<AxisCard
  variant="onboarding"
  visual-support="image"
  identifier-type="tag"
  tag="Getting Started"
  :tag-icon="DocumentTextIcon"
  title="Welcome Guide"
  description="Learn the basics of our platform"
  state="default"
  action-label="Start Tour"
/>

<!-- Table variant for data format instructions -->
<AxisCard
  variant="onboarding"
  visual-support="table"
  identifier-type="tag"
  tag="CSV Format"
  :tag-icon="TableCellsIcon"
  title="Property Import Format"
  description="Your file must follow this column structure"
  support-text="Maximum file size: 50MB"
  state="default"
  action-label="Download Template"
>
  <template #table>
    <!-- Your table component here -->
  </template>
</AxisCard>`,

  user: `<!-- Clickable user card (navigates somewhere) -->
<AxisCard
  variant="user"
  avatar-src="/path/to/avatar.jpg"
  user-name="German Alvarez"
  user-email="german@8020rei.com"
  user-role="Superadmin"
  user-status="active"
  clickable
  @click="navigateTo('/users/' + userId)"
/>

<!-- Non-clickable (informative only) -->
<AxisCard
  variant="user"
  user-name="John Smith"
  user-email="john@example.com"
  user-role="Client User"
  user-status="pending"
/>

<!-- With custom slot content -->
<AxisCard
  variant="user"
  avatar-src="/path/to/avatar.jpg"
  user-name="Emily Davis"
  user-email="emily@corp.io"
  user-role="Internal"
  user-status="inactive"
>
  <div class="flex gap-2">
    <AxisButton size="sm" variant="ghost">Edit</AxisButton>
    <AxisButton size="sm" variant="ghost" destructive>Remove</AxisButton>
  </div>
</AxisCard>`,
};
</script>

<template>
  <div>
    <!-- Header -->
    <div class="docs-page-header">
      <h1 class="docs-page-title">Cards</h1>
      <p class="docs-page-description">
        Versatile container components for grouping related content and actions.
      </p>
    </div>

    <!-- Overview -->
    <div class="docs-section-highlight">
      <h2 class="docs-section-title">Overview</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Cards are surfaces that display content and actions on a single topic. They should be easy to scan for relevant
        and actionable information. Use cards to present grouped information with clear visual boundaries.
      </p>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AxisCard>
          <p class="text-body-regular text-content-secondary">Base card with default styling</p>
        </AxisCard>
        <AxisCard
          variant="stat"
          label="Total Revenue"
          value="$123,456"
          secondary-value="+12.5%"
          color="success"
          :icon="CurrencyDollarIcon"
        />
        <AxisCard
          variant="action"
          title="Add Property"
          description="Quick action card"
          :icon="HomeIcon"
        />
      </div>
    </div>

    <!-- MANDATORY RULE Notice -->
    <div class="docs-section">
      <AxisCallout type="warning" title="Mandatory Rule - No Exceptions">
        All card containers in the platform MUST use the <code class="bg-alert-100 dark:bg-alert-900 px-1 rounded">AxisCard</code> component.
        Ad-hoc card styles with inline classes are <strong>strictly prohibited</strong>.
      </AxisCallout>
    </div>

    <!-- ============================================ -->
    <!-- VARIANTS -->
    <!-- ============================================ -->
    <div class="docs-section">
      <h2 class="docs-section-title">Variants</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Six variants to cover all card use cases. Choose based on the content type and interaction pattern.
      </p>

      <div class="overflow-x-auto mb-6">
        <table class="w-full text-left">
          <thead>
            <tr class="border-b border-stroke">
              <th class="py-2 pr-4 text-label-bold text-content-secondary">Variant</th>
              <th class="py-2 pr-4 text-label-bold text-content-secondary">Use Case</th>
              <th class="py-2 text-label-bold text-content-secondary">Key Features</th>
            </tr>
          </thead>
          <tbody class="text-body-regular text-content-secondary">
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">base</code></td>
              <td class="py-2 pr-4">General content container</td>
              <td class="py-2">Header, body, footer slots; Optional media</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">stat</code></td>
              <td class="py-2 pr-4">KPI/metric display</td>
              <td class="py-2">Icon, label, value; Progress bar or donut chart</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">action</code></td>
              <td class="py-2 pr-4">Clickable action items</td>
              <td class="py-2">Title, description, CTA; Hover states</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">selectable</code></td>
              <td class="py-2 pr-4">Radio/checkbox selection</td>
              <td class="py-2">Selection indicator; Active/selected states</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">onboarding</code></td>
              <td class="py-2 pr-4">Step-by-step guidance</td>
              <td class="py-2">Step number/tag; State progression</td>
            </tr>
            <tr>
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">user</code></td>
              <td class="py-2 pr-4">User profile display</td>
              <td class="py-2">Avatar, name, email, role badge, status</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- BASE VARIANT -->
    <!-- ============================================ -->
    <div class="docs-section">
      <h2 class="docs-section-title">Base Variant</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        General-purpose content container with flexible slot-based composition.
      </p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <!-- Simple base card -->
        <AxisCard>
          <template #header>
            <div class="flex items-center gap-2">
              <DocumentTextIcon class="w-5 h-5 text-content-secondary" />
              <h3 class="text-body-regular font-semibold text-content-primary">Document Overview</h3>
            </div>
          </template>
          <p class="text-body-regular text-content-secondary">
            This is the body content of the card. You can place any content here including text, images, or other components.
          </p>
          <template #footer>
            <div class="flex justify-end gap-2">
              <AxisButton variant="ghost" size="sm">Cancel</AxisButton>
              <AxisButton size="sm">Save</AxisButton>
            </div>
          </template>
        </AxisCard>

        <!-- Card with media -->
        <AxisCard>
          <template #media>
            <div class="h-32 bg-gradient-to-r from-main-500 to-accent-1-500 flex items-center justify-center">
              <PhotoIcon class="w-12 h-12 text-white/50" />
            </div>
          </template>
          <h3 class="text-body-regular font-semibold text-content-primary mb-1">Card with Media</h3>
          <p class="text-body-regular text-content-secondary">
            Cards can include a media section for images, videos, or custom visuals.
          </p>
        </AxisCard>
      </div>

      <!-- Elevation options -->
      <h3 class="text-body-regular font-medium text-content-primary mb-3">Elevation Options</h3>
      <p class="text-label text-content-tertiary mb-3">
        Note: Elevation shadows are only visible in light mode. In dark mode, cards rely on borders and background colors for visual hierarchy.
      </p>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AxisCard elevation="flat">
          <p class="text-label text-content-secondary mb-1">Flat (Default)</p>
          <code class="text-suggestion bg-surface-raised dark:bg-neutral-800 px-1 rounded">elevation="flat"</code>
        </AxisCard>
        <AxisCard elevation="raised">
          <p class="text-label text-content-secondary mb-1">Raised</p>
          <code class="text-suggestion bg-surface-raised dark:bg-neutral-800 px-1 rounded">elevation="raised"</code>
        </AxisCard>
        <AxisCard elevation="elevated">
          <p class="text-label text-content-secondary mb-1">Elevated</p>
          <code class="text-suggestion bg-surface-raised dark:bg-neutral-800 px-1 rounded">elevation="elevated"</code>
        </AxisCard>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- STAT VARIANT -->
    <!-- ============================================ -->
    <div class="docs-section">
      <h2 class="docs-section-title">Stat Variant</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Display KPIs, metrics, and data points with optional visualizations.
      </p>

      <!-- Simple stats -->
      <h3 class="text-body-regular font-medium text-content-primary mb-3">Simple Display</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <AxisCard
          v-for="item in statItems"
          :key="item.label"
          variant="stat"
          :label="item.label"
          :value="item.value"
          :secondary-value="item.secondaryValue"
          :color="item.color"
          :icon="ChartBarIcon"
        />
      </div>

      <!-- Bar display -->
      <h3 class="text-body-regular font-medium text-content-primary mb-3">Bar Display</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <AxisCard
          variant="stat"
          display="bar"
          label="Project Progress"
          value="75%"
          :progress="75"
          color="main"
        />
        <AxisCard
          variant="stat"
          display="bar"
          label="Storage Used"
          value="45 GB"
          secondary-value="/ 100 GB"
          :progress="45"
          color="accent"
        />
        <AxisCard
          variant="stat"
          display="bar"
          label="Goal Completion"
          value="92%"
          :progress="92"
          color="success"
        />
      </div>

      <!-- Donut display -->
      <h3 class="text-body-regular font-medium text-content-primary mb-3">Donut Display</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <AxisCard
          variant="stat"
          display="donut"
          label="CPU Usage"
          value="Active"
          :progress="68"
          color="main"
        />
        <AxisCard
          variant="stat"
          display="donut"
          label="Memory"
          value="12.4 GB"
          :progress="85"
          color="error"
        />
        <AxisCard
          variant="stat"
          display="donut"
          label="Disk Space"
          value="256 GB"
          :progress="32"
          color="success"
        />
      </div>

      <!-- Color options -->
      <h3 class="text-body-regular font-medium text-content-primary mb-3">Color Options</h3>
      <div class="flex flex-wrap gap-2">
        <code class="text-label bg-surface-raised dark:bg-neutral-800 px-2 py-1 rounded">neutral</code>
        <code class="text-label bg-main-100 dark:bg-main-900 text-main-700 dark:text-main-300 px-2 py-1 rounded">main</code>
        <code class="text-label bg-success-100 dark:bg-success-900 text-success-700 dark:text-success-300 px-2 py-1 rounded">success</code>
        <code class="text-label bg-error-100 dark:bg-error-900 text-error-700 dark:text-error-300 px-2 py-1 rounded">error</code>
        <code class="text-label bg-accent-1-100 dark:bg-accent-1-900 text-accent-1-700 dark:text-accent-1-300 px-2 py-1 rounded">accent</code>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- ACTION VARIANT -->
    <!-- ============================================ -->
    <div class="docs-section">
      <h2 class="docs-section-title">Action Variant</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Interactive cards for navigation and triggering actions. Includes hover states and optional CTA.
      </p>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AxisCard
          variant="action"
          title="Add Property"
          description="Search and add new properties to your portfolio"
          :icon="HomeIcon"
          action-label="Add"
          :action-icon="ArrowRightIcon"
        />
        <AxisCard
          variant="action"
          title="Invite Team"
          description="Add team members and manage permissions"
          :icon="UserGroupIcon"
          action-label="Invite"
          :action-icon="ArrowRightIcon"
        />
        <AxisCard
          variant="action"
          title="Run Analysis"
          description="Generate insights from your property data"
          :icon="BoltIcon"
          action-label="Start"
          :action-icon="ArrowRightIcon"
        />
      </div>
    </div>

    <!-- ============================================ -->
    <!-- SELECTABLE VARIANT -->
    <!-- ============================================ -->
    <div class="docs-section">
      <h2 class="docs-section-title">Selectable Variant</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Radio-style or checkbox-style selection cards. Use with <code class="bg-surface-raised dark:bg-neutral-800 px-1 rounded">AxisCardGroup</code> for proper group behavior.
      </p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- Radio group -->
        <div>
          <h3 class="text-body-regular font-medium text-content-primary mb-3">Radio Selection (Single)</h3>
          <p class="text-label text-content-secondary mb-3">Selected: {{ selectedPlan || 'None' }}</p>
          <div class="space-y-3">
            <AxisCard
              v-for="plan in planOptions"
              :key="plan.id"
              variant="selectable"
              :label="plan.name"
              :selected="selectedPlan === plan.id"
              :selection-value="plan.id"
              @update:selected="selectedPlan = plan.id"
            >
              <p class="text-label text-content-tertiary">{{ plan.price }}</p>
              <p class="text-body-regular text-content-secondary mt-1">{{ plan.description }}</p>
            </AxisCard>
          </div>
        </div>

        <!-- Checkbox group -->
        <div>
          <h3 class="text-body-regular font-medium text-content-primary mb-3">Checkbox Selection (Multiple)</h3>
          <p class="text-label text-content-secondary mb-3">Selected: {{ selectedFeatures.length > 0 ? selectedFeatures.join(', ') : 'None' }}</p>
          <div class="space-y-3">
            <AxisCard
              v-for="feature in featureOptions"
              :key="feature.id"
              variant="selectable"
              selection-type="checkbox"
              :label="feature.name"
              :selected="selectedFeatures.includes(feature.id)"
              :selection-value="feature.id"
              @update:selected="(val: boolean) => {
                if (val) {
                  selectedFeatures.push(feature.id)
                } else {
                  selectedFeatures = selectedFeatures.filter(id => id !== feature.id)
                }
              }"
            >
              <p class="text-body-regular text-content-secondary">{{ feature.description }}</p>
            </AxisCard>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- CLICKABLE CARDS -->
    <!-- ============================================ -->
    <div class="docs-section">
      <h2 class="docs-section-title">Clickable Cards</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Cards that navigate to another page must use the <code class="bg-surface-raised dark:bg-neutral-800 px-1 rounded">clickable</code> prop
        to enable hover and focus states. This provides visual feedback so users know the card is interactive.
      </p>

      <AxisCallout type="warning" title="Important" class="mb-4">
        <p class="text-body-regular">
          <strong>Clickable vs Informative:</strong> Only use <code class="bg-alert-100 dark:bg-alert-900 px-1 rounded">clickable</code>
          on cards that lead somewhere (navigation). Purely informative cards should NOT have hover states.
        </p>
      </AxisCallout>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <!-- Clickable card example -->
        <div>
          <p class="text-label font-medium text-content-secondary mb-2">Clickable (navigates to detail page)</p>
          <AxisCard
            variant="user"
            :avatar-src="userExamples[0].avatarSrc"
            :user-name="userExamples[0].userName"
            :user-email="userExamples[0].userEmail"
            :user-role="userExamples[0].userRole"
            :user-status="userExamples[0].userStatus"
            clickable
            class="hover:shadow-md"
          />
        </div>

        <!-- Non-clickable card example -->
        <div>
          <p class="text-label font-medium text-content-secondary mb-2">Non-clickable (informative only)</p>
          <AxisCard
            variant="user"
            :avatar-src="userExamples[1].avatarSrc"
            :user-name="userExamples[1].userName"
            :user-email="userExamples[1].userEmail"
            :user-role="userExamples[1].userRole"
            :user-status="userExamples[1].userStatus"
          />
        </div>
      </div>

      <!-- Hover behavior -->
      <h3 class="text-body-regular font-medium text-content-primary mb-3">Hover Behavior</h3>
      <p class="text-body-regular text-content-secondary mb-3">
        Clickable cards get the following hover/focus states:
      </p>
      <ul class="space-y-2 text-body-regular text-content-secondary mb-4">
        <li class="flex items-start gap-2">
          <span class="text-main-500 mt-1">•</span>
          <span><strong>Cursor:</strong> <code class="bg-surface-raised dark:bg-neutral-800 px-1 rounded">cursor-pointer</code></span>
        </li>
        <li class="flex items-start gap-2">
          <span class="text-main-500 mt-1">•</span>
          <span><strong>Border:</strong> Changes to <code class="bg-surface-raised dark:bg-neutral-800 px-1 rounded">main-300</code> (light) / <code class="bg-surface-raised dark:bg-neutral-800 px-1 rounded">main-500</code> (dark)</span>
        </li>
        <li class="flex items-start gap-2">
          <span class="text-main-500 mt-1">•</span>
          <span><strong>Shadow:</strong> Subtle shadow (light) / Enhanced shadow with brand glow (dark)</span>
        </li>
        <li class="flex items-start gap-2">
          <span class="text-main-500 mt-1">•</span>
          <span><strong>Focus:</strong> 2px ring with <code class="bg-surface-raised dark:bg-neutral-800 px-1 rounded">main-500</code> color for keyboard navigation</span>
        </li>
      </ul>

      <!-- Code example -->
      <h3 class="text-body-regular font-medium text-content-primary mb-3">Usage Example</h3>
      <div class="border border-stroke rounded-lg overflow-hidden">
        <pre class="p-4 text-label bg-neutral-900 overflow-x-auto"><code class="text-neutral-100">&lt;!-- Card that navigates to user detail --&gt;
&lt;AxisCard
  variant="user"
  :avatar-src="user.picture"
  :user-name="user.name"
  :user-email="user.email"
  :user-role="user.role"
  :user-status="user.is_active ? 'active' : 'inactive'"
  clickable
  @click="navigateTo(`/users/${user.id}`)"
/&gt;

&lt;!-- Card that shows info only (no navigation) --&gt;
&lt;AxisCard
  variant="user"
  :avatar-src="user.picture"
  :user-name="user.name"
  :user-email="user.email"
  :user-role="user.role"
  :user-status="user.status"
/&gt;</code></pre>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- USER VARIANT -->
    <!-- ============================================ -->
    <div class="docs-section">
      <h2 class="docs-section-title">User Variant</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Display user profile information with avatar, name, email, role badge, and status indicator.
        Ideal for user management interfaces, team directories, and permission dashboards.
      </p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <AxisCard
          v-for="(user, index) in userExamples"
          :key="index"
          variant="user"
          :avatar-src="user.avatarSrc"
          :user-name="user.userName"
          :user-email="user.userEmail"
          :user-role="user.userRole"
          :user-status="user.userStatus"
        />
      </div>

      <!-- Status Options -->
      <h3 class="text-body-regular font-medium text-content-primary mb-3">Status Options</h3>
      <div class="flex flex-wrap gap-2 mb-4">
        <code class="text-label bg-success-100 dark:bg-success-900 text-success-700 dark:text-success-300 px-2 py-1 rounded">active</code>
        <code class="text-label bg-alert-100 dark:bg-alert-900 text-alert-700 dark:text-alert-300 px-2 py-1 rounded">pending</code>
        <code class="text-label bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 px-2 py-1 rounded">inactive</code>
      </div>

      <!-- Key Props -->
      <h3 class="text-body-regular font-medium text-content-primary mt-6 mb-3">Key Props</h3>
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="border-b border-stroke">
              <th class="py-2 pr-4 text-label-bold text-content-secondary">Prop</th>
              <th class="py-2 pr-4 text-label-bold text-content-secondary">Type</th>
              <th class="py-2 text-label-bold text-content-secondary">Purpose</th>
            </tr>
          </thead>
          <tbody class="text-body-regular text-content-secondary">
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">avatar-src</code></td>
              <td class="py-2 pr-4 text-label">string</td>
              <td class="py-2 text-label">URL for user's avatar image (shows initials if not provided)</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">user-name</code></td>
              <td class="py-2 pr-4 text-label">string</td>
              <td class="py-2 text-label">User's display name</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">user-email</code></td>
              <td class="py-2 pr-4 text-label">string</td>
              <td class="py-2 text-label">User's email address</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">user-role</code></td>
              <td class="py-2 pr-4 text-label">string</td>
              <td class="py-2 text-label">User's role displayed as a badge</td>
            </tr>
            <tr>
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">user-status</code></td>
              <td class="py-2 pr-4 text-label">'active' | 'inactive' | 'pending'</td>
              <td class="py-2 text-label">User's current status with color-coded indicator</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- ONBOARDING VARIANT -->
    <!-- ============================================ -->
    <div class="docs-section">
      <h2 class="docs-section-title">Onboarding Variant</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Step-by-step guidance cards with state progression. Two visual support types (image/table) and two identifier types (number/tag).
        Critical for property import workflows and user onboarding flows.
      </p>

      <!-- Visual Support Types Overview -->
      <AxisCallout type="info" title="Visual Support Types" class="mb-6">
        <p class="text-body-regular">
          <strong>Image:</strong> Use for step-by-step tutorials with visual aids (screenshots, illustrations).
          <strong>Table:</strong> Use for data format instructions, especially property import templates.
        </p>
      </AxisCallout>

      <!-- IMAGE VARIANT - Number Identifier -->
      <h3 class="text-body-regular font-medium text-content-primary mt-6 mb-3">Image Variant with Number Identifier</h3>
      <p class="text-label text-content-tertiary mb-4">
        Classic step-by-step onboarding with numbered steps. Ideal for sequential workflows.
      </p>
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <AxisCard
          v-for="step in onboardingImageNumber"
          :key="step.step"
          variant="onboarding"
          visual-support="image"
          identifier-type="number"
          :step="step.step"
          :title="step.title"
          :description="step.description"
          :support-text="step.supportText"
          :state="step.state"
          :action-label="step.state === 'active' ? 'Continue' : step.state === 'default' ? 'Start' : step.state === 'completed' ? undefined : undefined"
          :action-icon="ArrowRightIcon"
        >
          <template #media>
            <div class="aspect-video bg-gradient-to-br from-main-100 to-main-200 dark:from-main-900 dark:to-main-800 flex items-center justify-center">
              <DocumentDuplicateIcon class="w-12 h-12 text-main-400 dark:text-main-600" />
            </div>
          </template>
        </AxisCard>
      </div>

      <!-- IMAGE VARIANT - Tag Identifier -->
      <h3 class="text-body-regular font-medium text-content-primary mt-6 mb-3">Image Variant with Tag Identifier</h3>
      <p class="text-label text-content-tertiary mb-4">
        Use tags instead of numbers for category-based onboarding or when steps aren't strictly sequential.
      </p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <AxisCard
          variant="onboarding"
          visual-support="image"
          identifier-type="tag"
          tag="Getting Started"
          :tag-icon="DocumentTextIcon"
          title="Welcome to 8020 Platform"
          description="Learn the basics of navigating the platform and discovering key features that will help you manage your property portfolio."
          support-text="Estimated read time: 3 minutes"
          state="default"
          action-label="Begin Tour"
          :action-icon="ArrowRightIcon"
        >
          <template #media>
            <div class="aspect-video bg-gradient-to-br from-accent-1-100 to-accent-1-200 dark:from-accent-1-900 dark:to-accent-1-800 flex items-center justify-center">
              <HomeIcon class="w-12 h-12 text-accent-1-400 dark:text-accent-1-600" />
            </div>
          </template>
        </AxisCard>

        <AxisCard
          variant="onboarding"
          visual-support="image"
          identifier-type="tag"
          tag="Pro Tip"
          :tag-icon="BoltIcon"
          title="Keyboard Shortcuts"
          description="Speed up your workflow with keyboard shortcuts. Press '?' anywhere in the app to see available shortcuts."
          support-text="Power users save 30% more time"
          state="active"
          action-label="View Shortcuts"
          :action-icon="ArrowRightIcon"
        >
          <template #media>
            <div class="aspect-video bg-gradient-to-br from-success-100 to-success-200 dark:from-success-900 dark:to-success-800 flex items-center justify-center">
              <BoltIcon class="w-12 h-12 text-success-400 dark:text-success-600" />
            </div>
          </template>
        </AxisCard>
      </div>

      <!-- TABLE VARIANT -->
      <h3 class="text-body-regular font-medium text-content-primary mt-6 mb-3">Table Variant</h3>
      <p class="text-label text-content-tertiary mb-4">
        Critical for property import workflows. Shows data format requirements with an embedded table preview.
      </p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <AxisCard
          v-for="(example, index) in tableOnboardingExamples"
          :key="index"
          variant="onboarding"
          visual-support="table"
          identifier-type="tag"
          :tag="example.tag"
          :tag-icon="TableCellsIcon"
          :title="example.title"
          :description="example.description"
          :support-text="example.supportText"
          :state="example.state"
          action-label="Download Template"
          :action-icon="ArrowRightIcon"
        >
          <template #table>
            <!-- Simple table preview -->
            <div class="border border-stroke rounded-lg overflow-hidden text-suggestion">
              <div class="grid grid-cols-4 bg-surface-raised">
                <div class="px-3 py-1.5 border-r border-b border-stroke font-semibold text-content-primary">Address</div>
                <div class="px-3 py-1.5 border-r border-b border-stroke font-semibold text-content-primary">City</div>
                <div class="px-3 py-1.5 border-r border-b border-stroke font-semibold text-content-primary">State</div>
                <div class="px-3 py-1.5 border-b border-stroke font-semibold text-content-primary">ZIP</div>
              </div>
              <div class="grid grid-cols-4 bg-surface-base">
                <div class="px-3 py-1.5 border-r border-stroke text-content-secondary">123 Main St</div>
                <div class="px-3 py-1.5 border-r border-stroke text-content-secondary">Austin</div>
                <div class="px-3 py-1.5 border-r border-stroke text-content-secondary">TX</div>
                <div class="px-3 py-1.5 text-content-secondary">78701</div>
              </div>
            </div>
          </template>
        </AxisCard>
      </div>

      <!-- States -->
      <h3 class="text-body-regular font-medium text-content-primary mt-6 mb-3">States</h3>
      <div class="flex flex-wrap gap-2 mb-4">
        <code class="text-label bg-surface-raised dark:bg-neutral-800 px-2 py-1 rounded">default</code>
        <code class="text-label bg-neutral-100 dark:bg-neutral-800 text-content-tertiary px-2 py-1 rounded">non-completed</code>
        <code class="text-label bg-main-100 dark:bg-main-900 text-main-700 dark:text-main-300 px-2 py-1 rounded">active</code>
        <code class="text-label bg-success-100 dark:bg-success-900 text-success-700 dark:text-success-300 px-2 py-1 rounded">completed</code>
      </div>

      <!-- Props Summary -->
      <h3 class="text-body-regular font-medium text-content-primary mt-6 mb-3">Key Props</h3>
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="border-b border-stroke">
              <th class="py-2 pr-4 text-label-bold text-content-secondary">Prop</th>
              <th class="py-2 pr-4 text-label-bold text-content-secondary">Values</th>
              <th class="py-2 text-label-bold text-content-secondary">Purpose</th>
            </tr>
          </thead>
          <tbody class="text-body-regular text-content-secondary">
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">visual-support</code></td>
              <td class="py-2 pr-4 text-label">'image' | 'table'</td>
              <td class="py-2 text-label">Type of visual content (image section vs table section)</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">identifier-type</code></td>
              <td class="py-2 pr-4 text-label">'number' | 'tag'</td>
              <td class="py-2 text-label">Step number circle or tag pill</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">step</code></td>
              <td class="py-2 pr-4 text-label">number</td>
              <td class="py-2 text-label">Step number (for number identifier)</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">tag</code></td>
              <td class="py-2 pr-4 text-label">string</td>
              <td class="py-2 text-label">Tag text (for tag identifier)</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">tag-icon</code></td>
              <td class="py-2 pr-4 text-label">Component</td>
              <td class="py-2 text-label">Icon component for tag</td>
            </tr>
            <tr>
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">support-text</code></td>
              <td class="py-2 pr-4 text-label">string</td>
              <td class="py-2 text-label">Additional helper text below description</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- SUB-COMPONENTS -->
    <!-- ============================================ -->
    <div class="docs-section">
      <h2 class="docs-section-title">Sub-Components</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Optional helper components for composing complex card layouts.
      </p>

      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="border-b border-stroke">
              <th class="py-2 pr-4 text-label-bold text-content-secondary">Component</th>
              <th class="py-2 pr-4 text-label-bold text-content-secondary">Purpose</th>
              <th class="py-2 text-label-bold text-content-secondary">Key Props</th>
            </tr>
          </thead>
          <tbody class="text-body-regular text-content-secondary">
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">AxisCardHeader</code></td>
              <td class="py-2 pr-4">Title, subtitle, and actions</td>
              <td class="py-2"><code class="text-suggestion">title, subtitle, icon</code></td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">AxisCardMedia</code></td>
              <td class="py-2 pr-4">Image or custom media</td>
              <td class="py-2"><code class="text-suggestion">src, alt, aspectRatio, fit</code></td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">AxisCardBody</code></td>
              <td class="py-2 pr-4">Content wrapper with padding</td>
              <td class="py-2"><code class="text-suggestion">padding</code></td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">AxisCardFooter</code></td>
              <td class="py-2 pr-4">Actions and metadata</td>
              <td class="py-2"><code class="text-suggestion">align, divider, padding</code></td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">AxisCardProgress</code></td>
              <td class="py-2 pr-4">Progress bar visualization</td>
              <td class="py-2"><code class="text-suggestion">value, color, size, showLabel</code></td>
            </tr>
            <tr>
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">AxisCardDonut</code></td>
              <td class="py-2 pr-4">Donut chart visualization</td>
              <td class="py-2"><code class="text-suggestion">value, color, size, showValue</code></td>
            </tr>
          </tbody>
        </table>
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
              <span>Use cards to group related content visually</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Choose the appropriate variant for your use case</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Use consistent card sizing within a layout</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Provide clear visual hierarchy within cards</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Use AxisCardGroup for selectable card sets</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Use <code class="bg-success-100 dark:bg-success-900 px-1 rounded">clickable</code> for cards that navigate somewhere</span>
            </li>
          </ul>
        </div>

        <!-- Don'ts -->
        <div>
          <h3 class="text-h5 text-error-700 dark:text-error-400 mb-3">Don't</h3>
          <ul class="space-y-2 text-body-regular text-content-secondary">
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Overload cards with too much information</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Mix different card styles inconsistently</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Create custom card styles outside this system</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Use action cards for non-interactive content</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Nest cards within cards</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Add hover states to informative-only cards</span>
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
              <th class="py-2 text-label-bold text-content-secondary">Description</th>
            </tr>
          </thead>
          <tbody class="text-body-regular text-content-secondary">
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">variant</code></td>
              <td class="py-2 pr-4 text-label">'base' | 'stat' | 'action' | 'selectable' | 'onboarding'</td>
              <td class="py-2 pr-4 text-label">'base'</td>
              <td class="py-2 text-label">Card variant</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">elevation</code></td>
              <td class="py-2 pr-4 text-label">'flat' | 'raised' | 'elevated'</td>
              <td class="py-2 pr-4 text-label">'flat'</td>
              <td class="py-2 text-label">Shadow level</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">padding</code></td>
              <td class="py-2 pr-4 text-label">'none' | 'sm' | 'md' | 'lg'</td>
              <td class="py-2 pr-4 text-label">'md'</td>
              <td class="py-2 text-label">Internal padding</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">bordered</code></td>
              <td class="py-2 pr-4 text-label">boolean</td>
              <td class="py-2 pr-4 text-label">true</td>
              <td class="py-2 text-label">Show border</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">interactive</code></td>
              <td class="py-2 pr-4 text-label">boolean</td>
              <td class="py-2 pr-4 text-label">false</td>
              <td class="py-2 text-label">Enable hover/focus states (legacy)</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">clickable</code></td>
              <td class="py-2 pr-4 text-label">boolean</td>
              <td class="py-2 pr-4 text-label">false</td>
              <td class="py-2 text-label">Enable hover/focus for navigation cards</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">disabled</code></td>
              <td class="py-2 pr-4 text-label">boolean</td>
              <td class="py-2 pr-4 text-label">false</td>
              <td class="py-2 text-label">Disable the card</td>
            </tr>
            <tr class="border-b border-stroke-subtle bg-surface-raised">
              <td colspan="4" class="py-2 pr-4 text-label-bold text-content-primary">Stat Variant Props</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">display</code></td>
              <td class="py-2 pr-4 text-label">'simple' | 'bar' | 'donut'</td>
              <td class="py-2 pr-4 text-label">'simple'</td>
              <td class="py-2 text-label">Visual display type</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">label</code></td>
              <td class="py-2 pr-4 text-label">string</td>
              <td class="py-2 pr-4 text-label">-</td>
              <td class="py-2 text-label">Metric label</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">value</code></td>
              <td class="py-2 pr-4 text-label">string | number</td>
              <td class="py-2 pr-4 text-label">-</td>
              <td class="py-2 text-label">Primary value</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">progress</code></td>
              <td class="py-2 pr-4 text-label">number</td>
              <td class="py-2 pr-4 text-label">-</td>
              <td class="py-2 text-label">Progress percentage (0-100)</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">color</code></td>
              <td class="py-2 pr-4 text-label">'neutral' | 'main' | 'success' | 'error' | 'accent'</td>
              <td class="py-2 pr-4 text-label">'neutral'</td>
              <td class="py-2 text-label">Accent color</td>
            </tr>
            <tr class="border-b border-stroke-subtle bg-surface-raised">
              <td colspan="4" class="py-2 pr-4 text-label-bold text-content-primary">Selectable Variant Props</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">selected</code></td>
              <td class="py-2 pr-4 text-label">boolean</td>
              <td class="py-2 pr-4 text-label">false</td>
              <td class="py-2 text-label">Selection state (v-model:selected)</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">selection-type</code></td>
              <td class="py-2 pr-4 text-label">'radio' | 'checkbox'</td>
              <td class="py-2 pr-4 text-label">'radio'</td>
              <td class="py-2 text-label">Selection behavior</td>
            </tr>
            <tr class="border-b border-stroke-subtle bg-surface-raised">
              <td colspan="4" class="py-2 pr-4 text-label-bold text-content-primary">Onboarding Variant Props</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">visual-support</code></td>
              <td class="py-2 pr-4 text-label">'image' | 'table'</td>
              <td class="py-2 pr-4 text-label">'image'</td>
              <td class="py-2 text-label">Visual content type</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">identifier-type</code></td>
              <td class="py-2 pr-4 text-label">'number' | 'tag'</td>
              <td class="py-2 pr-4 text-label">'number'</td>
              <td class="py-2 text-label">Identifier style</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">step</code></td>
              <td class="py-2 pr-4 text-label">number</td>
              <td class="py-2 pr-4 text-label">-</td>
              <td class="py-2 text-label">Step number (for number identifier)</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">tag</code></td>
              <td class="py-2 pr-4 text-label">string</td>
              <td class="py-2 pr-4 text-label">-</td>
              <td class="py-2 text-label">Tag text (for tag identifier)</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">tag-icon</code></td>
              <td class="py-2 pr-4 text-label">Component</td>
              <td class="py-2 pr-4 text-label">null</td>
              <td class="py-2 text-label">Icon for tag identifier</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">support-text</code></td>
              <td class="py-2 pr-4 text-label">string</td>
              <td class="py-2 pr-4 text-label">-</td>
              <td class="py-2 text-label">Helper text below description</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">state</code></td>
              <td class="py-2 pr-4 text-label">'default' | 'non-completed' | 'active' | 'completed'</td>
              <td class="py-2 pr-4 text-label">'default'</td>
              <td class="py-2 text-label">Step state</td>
            </tr>
            <tr class="border-b border-stroke-subtle bg-surface-raised">
              <td colspan="4" class="py-2 pr-4 text-label-bold text-content-primary">User Variant Props</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">avatar-src</code></td>
              <td class="py-2 pr-4 text-label">string</td>
              <td class="py-2 pr-4 text-label">-</td>
              <td class="py-2 text-label">Avatar image URL (shows initials if not provided)</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">user-name</code></td>
              <td class="py-2 pr-4 text-label">string</td>
              <td class="py-2 pr-4 text-label">-</td>
              <td class="py-2 text-label">User's display name</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">user-email</code></td>
              <td class="py-2 pr-4 text-label">string</td>
              <td class="py-2 pr-4 text-label">-</td>
              <td class="py-2 text-label">User's email address</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">user-role</code></td>
              <td class="py-2 pr-4 text-label">string</td>
              <td class="py-2 pr-4 text-label">-</td>
              <td class="py-2 text-label">User's role displayed as badge</td>
            </tr>
            <tr>
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">user-status</code></td>
              <td class="py-2 pr-4 text-label">'active' | 'inactive' | 'pending'</td>
              <td class="py-2 pr-4 text-label">'active'</td>
              <td class="py-2 text-label">User's status with indicator</td>
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
        <div class="p-4 bg-accent-1-50 dark:bg-accent-1-950 border border-accent-1-200 dark:border-accent-1-800 rounded-lg">
          <h3 class="text-body-regular font-medium text-accent-1-900 dark:text-accent-1-100 mb-2">Keyboard Navigation</h3>
          <ul class="text-label text-accent-1-800 dark:text-accent-1-300 space-y-1">
            <li><strong>Tab:</strong> Move focus to interactive cards</li>
            <li><strong>Enter/Space:</strong> Activate selectable or action cards</li>
            <li><strong>Focus ring:</strong> Visible focus indicator (2px main-500)</li>
          </ul>
        </div>

        <div class="p-4 bg-surface-raised border border-stroke rounded-lg">
          <h3 class="text-body-regular font-medium text-content-primary mb-2">ARIA Attributes</h3>
          <ul class="text-label text-content-secondary space-y-1">
            <li><code class="bg-surface-raised dark:bg-neutral-700 px-1 rounded">role="radio"</code> / <code class="bg-surface-raised dark:bg-neutral-700 px-1 rounded">role="checkbox"</code> - Selectable cards</li>
            <li><code class="bg-surface-raised dark:bg-neutral-700 px-1 rounded">aria-checked</code> - Selection state</li>
            <li><code class="bg-surface-raised dark:bg-neutral-700 px-1 rounded">aria-disabled</code> - Disabled state</li>
            <li><code class="bg-surface-raised dark:bg-neutral-700 px-1 rounded">role="progressbar"</code> - Progress indicators</li>
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
        <!-- Base -->
        <div class="border border-stroke rounded-lg overflow-hidden">
          <div class="px-4 py-2 bg-surface-raised border-b border-stroke flex items-center justify-between">
            <span class="text-label-bold text-content-secondary">Base Card</span>
            <button
              class="text-label text-main-700 dark:text-main-400 hover:text-main-900 dark:hover:text-main-300"
              @click="copyToClipboard(codeExamples.base)"
            >
              {{ copiedCode === codeExamples.base ? 'Copied!' : 'Copy' }}
            </button>
          </div>
          <pre class="p-4 text-label bg-neutral-900 overflow-x-auto"><code class="text-neutral-100">{{ codeExamples.base }}</code></pre>
        </div>

        <!-- Stat -->
        <div class="border border-stroke rounded-lg overflow-hidden">
          <div class="px-4 py-2 bg-surface-raised border-b border-stroke flex items-center justify-between">
            <span class="text-label-bold text-content-secondary">Stat Cards</span>
            <button
              class="text-label text-main-700 dark:text-main-400 hover:text-main-900 dark:hover:text-main-300"
              @click="copyToClipboard(codeExamples.stat)"
            >
              {{ copiedCode === codeExamples.stat ? 'Copied!' : 'Copy' }}
            </button>
          </div>
          <pre class="p-4 text-label bg-neutral-900 overflow-x-auto"><code class="text-neutral-100">{{ codeExamples.stat }}</code></pre>
        </div>

        <!-- Action -->
        <div class="border border-stroke rounded-lg overflow-hidden">
          <div class="px-4 py-2 bg-surface-raised border-b border-stroke flex items-center justify-between">
            <span class="text-label-bold text-content-secondary">Action Card</span>
            <button
              class="text-label text-main-700 dark:text-main-400 hover:text-main-900 dark:hover:text-main-300"
              @click="copyToClipboard(codeExamples.action)"
            >
              {{ copiedCode === codeExamples.action ? 'Copied!' : 'Copy' }}
            </button>
          </div>
          <pre class="p-4 text-label bg-neutral-900 overflow-x-auto"><code class="text-neutral-100">{{ codeExamples.action }}</code></pre>
        </div>

        <!-- Selectable -->
        <div class="border border-stroke rounded-lg overflow-hidden">
          <div class="px-4 py-2 bg-surface-raised border-b border-stroke flex items-center justify-between">
            <span class="text-label-bold text-content-secondary">Selectable Cards</span>
            <button
              class="text-label text-main-700 dark:text-main-400 hover:text-main-900 dark:hover:text-main-300"
              @click="copyToClipboard(codeExamples.selectable)"
            >
              {{ copiedCode === codeExamples.selectable ? 'Copied!' : 'Copy' }}
            </button>
          </div>
          <pre class="p-4 text-label bg-neutral-900 overflow-x-auto"><code class="text-neutral-100">{{ codeExamples.selectable }}</code></pre>
        </div>

        <!-- Onboarding -->
        <div class="border border-stroke rounded-lg overflow-hidden">
          <div class="px-4 py-2 bg-surface-raised border-b border-stroke flex items-center justify-between">
            <span class="text-label-bold text-content-secondary">Onboarding Card</span>
            <button
              class="text-label text-main-700 dark:text-main-400 hover:text-main-900 dark:hover:text-main-300"
              @click="copyToClipboard(codeExamples.onboarding)"
            >
              {{ copiedCode === codeExamples.onboarding ? 'Copied!' : 'Copy' }}
            </button>
          </div>
          <pre class="p-4 text-label bg-neutral-900 overflow-x-auto"><code class="text-neutral-100">{{ codeExamples.onboarding }}</code></pre>
        </div>

        <!-- User -->
        <div class="border border-stroke rounded-lg overflow-hidden">
          <div class="px-4 py-2 bg-surface-raised border-b border-stroke flex items-center justify-between">
            <span class="text-label-bold text-content-secondary">User Card</span>
            <button
              class="text-label text-main-700 dark:text-main-400 hover:text-main-900 dark:hover:text-main-300"
              @click="copyToClipboard(codeExamples.user)"
            >
              {{ copiedCode === codeExamples.user ? 'Copied!' : 'Copy' }}
            </button>
          </div>
          <pre class="p-4 text-label bg-neutral-900 overflow-x-auto"><code class="text-neutral-100">{{ codeExamples.user }}</code></pre>
        </div>
      </div>
    </div>
  </div>
</template>
