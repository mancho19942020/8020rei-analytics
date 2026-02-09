<script setup lang="ts">
definePageMeta({
  layout: "design-system",
});

useHead({
  title: "Typography | Design System | 8020",
});

// ============================================
// TYPOGRAPHY SPECIFICATION
// Source of truth - NO EXCEPTIONS
// ============================================

const headingStyles = [
  { name: "H1 Alt", cssClass: "text-h1-alt", size: "24px", weight: "600", lineHeight: "1.36", usage: "Hero sections, large displays" },
  { name: "H1", cssClass: "text-h1", size: "22px", weight: "600", lineHeight: "1.36", usage: "Page titles" },
  { name: "H2", cssClass: "text-h2", size: "20px", weight: "600", lineHeight: "1.36", usage: "Section titles" },
  { name: "H3", cssClass: "text-h3", size: "18px", weight: "600", lineHeight: "1.36", usage: "Subsections" },
  { name: "H4", cssClass: "text-h4", size: "16px", weight: "600", lineHeight: "1.36", usage: "Component titles" },
  { name: "H5", cssClass: "text-h5", size: "14px", weight: "600", lineHeight: "1.36", usage: "Small headers, card titles" },
  { name: "H6", cssClass: "text-h6", size: "12px", weight: "500", lineHeight: "1.36", usage: "Micro headers" },
  { name: "H7", cssClass: "text-h7", size: "10px", weight: "600", lineHeight: "1.36", usage: "Tiny headers, badges" },
];

const bodyStyles = [
  { name: "Body Large", cssClass: "text-body-large", size: "16px", weight: "400", lineHeight: "1.36", usage: "Lead text, introductions" },
  { name: "Body Regular", cssClass: "text-body-regular", size: "14px", weight: "400", lineHeight: "1.36", usage: "Default body text" },
];

const buttonStyles = [
  { name: "Button Large", cssClass: "text-button-large", size: "16px", weight: "500", lineHeight: "1.36", usage: "Primary CTA buttons" },
  { name: "Button Regular", cssClass: "text-button-regular", size: "14px", weight: "500", lineHeight: "1.36", usage: "Standard buttons" },
  { name: "Button Small", cssClass: "text-button-small", size: "12px", weight: "500", lineHeight: "1.36", usage: "Compact buttons, actions" },
];

const labelStyles = [
  { name: "Label Bold", cssClass: "text-label-bold", size: "12px", weight: "500", lineHeight: "1.36", usage: "Form labels, emphasized small text" },
  { name: "Label", cssClass: "text-label", size: "12px", weight: "400", lineHeight: "1.36", usage: "Helper text, metadata" },
];

const linkStyles = [
  { name: "Link", cssClass: "text-link", size: "14px", weight: "400", lineHeight: "1.36", usage: "Inline links" },
  { name: "Link Small", cssClass: "text-link-small", size: "12px", weight: "400", lineHeight: "1.36", usage: "Small links, breadcrumbs" },
];

const smallStyles = [
  { name: "Suggestion Bold", cssClass: "text-suggestion-bold", size: "10px", weight: "600", lineHeight: "1.36", usage: "Emphasized captions" },
  { name: "Suggestion", cssClass: "text-suggestion", size: "10px", weight: "400", lineHeight: "1.36", usage: "Captions, footnotes" },
];

// All styles combined for full reference
const allStyles = [
  ...headingStyles,
  ...bodyStyles,
  ...buttonStyles,
  ...labelStyles,
  ...linkStyles,
  ...smallStyles,
];

const copiedValue = ref<string | null>(null);

const copyToClipboard = async (value: string) => {
  try {
    await navigator.clipboard.writeText(value);
    copiedValue.value = value;
    setTimeout(() => { copiedValue.value = null; }, 1500);
  } catch (err) {
    console.error("Failed to copy:", err);
  }
};
</script>

<template>
  <div>
    <!-- Header -->
    <div class="docs-page-header">
      <h1 class="docs-page-title">Typography</h1>
      <p class="docs-page-description">
        Inter font family with 17 styles. Click any class name to copy.
      </p>
    </div>

    <!-- MANDATORY RULE Notice -->
    <div class="docs-section">
      <AxisCallout type="warning" title="Mandatory Rule - No Exceptions">
        Only typography tokens defined in this design system may be used. Raw Tailwind classes like
        <code class="bg-alert-100 dark:bg-alert-900 px-1 rounded text-label">text-sm</code>,
        <code class="bg-alert-100 dark:bg-alert-900 px-1 rounded text-label">text-lg</code>,
        <code class="bg-alert-100 dark:bg-alert-900 px-1 rounded text-label">text-2xl</code>, etc. are
        <strong>strictly prohibited</strong>.
      </AxisCallout>
    </div>

    <!-- Font Family -->
    <div class="docs-section">
      <h2 class="docs-section-title">Font Family</h2>
      <div class="flex items-center gap-8">
        <div>
          <p class="text-body-regular font-medium text-content-primary">Inter</p>
          <p class="text-label text-content-tertiary">Primary typeface (only)</p>
        </div>
        <div class="flex gap-6">
          <div class="text-center">
            <p class="text-h1 text-neutral-700 dark:text-neutral-300">Aa</p>
            <p class="text-label text-content-tertiary">400</p>
          </div>
          <div class="text-center">
            <p class="text-h1 text-neutral-700 dark:text-neutral-300 font-medium">Aa</p>
            <p class="text-label text-content-tertiary">500</p>
          </div>
          <div class="text-center">
            <p class="text-h1 text-neutral-700 dark:text-neutral-300 font-semibold">Aa</p>
            <p class="text-label text-content-tertiary">600</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Headings -->
    <div class="docs-section">
      <h2 class="docs-section-title">Headings</h2>
      <div class="space-y-2">
        <div
          v-for="style in headingStyles"
          :key="style.name"
          class="flex items-center gap-4 py-2 hover:bg-surface-raised -mx-2 px-2 rounded transition-colors"
        >
          <div class="w-14 shrink-0">
            <span class="text-label text-content-tertiary">{{ style.size }}</span>
          </div>
          <div class="w-24 shrink-0">
            <span :class="[style.cssClass, 'text-content-primary']">{{ style.name }}</span>
          </div>
          <div class="flex-1">
            <span :class="[style.cssClass, 'text-content-secondary']">Lorem ipsum dolor sit amet</span>
          </div>
          <div class="w-32 shrink-0">
            <span class="text-label text-content-tertiary">{{ style.usage }}</span>
          </div>
          <button
            class="relative w-28 shrink-0 text-left"
            @click="copyToClipboard(style.cssClass)"
          >
            <code class="text-label text-main-600 dark:text-main-400 hover:text-main-700 dark:hover:text-main-300 transition-colors">
              {{ style.cssClass }}
            </code>
            <span v-if="copiedValue === style.cssClass" class="absolute -top-5 left-0 text-suggestion-bold text-main-500">
              Copied!
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- Body Text -->
    <div class="docs-section">
      <h2 class="docs-section-title">Body Text</h2>
      <div class="space-y-2">
        <div
          v-for="style in bodyStyles"
          :key="style.name"
          class="flex items-center gap-4 py-2 hover:bg-surface-raised -mx-2 px-2 rounded transition-colors"
        >
          <div class="w-14 shrink-0">
            <span class="text-label text-content-tertiary">{{ style.size }}</span>
          </div>
          <div class="w-24 shrink-0">
            <span :class="[style.cssClass, 'text-content-primary']">{{ style.name }}</span>
          </div>
          <div class="flex-1">
            <span :class="[style.cssClass, 'text-content-secondary']">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</span>
          </div>
          <div class="w-32 shrink-0">
            <span class="text-label text-content-tertiary">{{ style.usage }}</span>
          </div>
          <button
            class="relative w-28 shrink-0 text-left"
            @click="copyToClipboard(style.cssClass)"
          >
            <code class="text-label text-main-600 dark:text-main-400 hover:text-main-700 dark:hover:text-main-300 transition-colors">
              {{ style.cssClass }}
            </code>
            <span v-if="copiedValue === style.cssClass" class="absolute -top-5 left-0 text-suggestion-bold text-main-500">
              Copied!
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- Buttons -->
    <div class="docs-section">
      <h2 class="docs-section-title">Buttons</h2>
      <div class="space-y-2">
        <div
          v-for="style in buttonStyles"
          :key="style.name"
          class="flex items-center gap-4 py-2 hover:bg-surface-raised -mx-2 px-2 rounded transition-colors"
        >
          <div class="w-14 shrink-0">
            <span class="text-label text-content-tertiary">{{ style.size }}</span>
          </div>
          <div class="w-24 shrink-0">
            <span :class="[style.cssClass, 'text-content-primary']">{{ style.name }}</span>
          </div>
          <div class="flex-1">
            <span :class="[style.cssClass, 'text-content-secondary']">Click me</span>
          </div>
          <div class="w-32 shrink-0">
            <span class="text-label text-content-tertiary">{{ style.usage }}</span>
          </div>
          <button
            class="relative w-28 shrink-0 text-left"
            @click="copyToClipboard(style.cssClass)"
          >
            <code class="text-label text-main-600 dark:text-main-400 hover:text-main-700 dark:hover:text-main-300 transition-colors">
              {{ style.cssClass }}
            </code>
            <span v-if="copiedValue === style.cssClass" class="absolute -top-5 left-0 text-suggestion-bold text-main-500">
              Copied!
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- Labels & Links -->
    <div class="docs-section">
      <h2 class="docs-section-title">Labels & Links</h2>
      <div class="space-y-2">
        <div
          v-for="style in [...labelStyles, ...linkStyles]"
          :key="style.name"
          class="flex items-center gap-4 py-2 hover:bg-surface-raised -mx-2 px-2 rounded transition-colors"
        >
          <div class="w-14 shrink-0">
            <span class="text-label text-content-tertiary">{{ style.size }}</span>
          </div>
          <div class="w-24 shrink-0">
            <span :class="[style.cssClass, 'text-content-primary']">{{ style.name }}</span>
          </div>
          <div class="flex-1">
            <span :class="[style.cssClass, style.name.includes('Link') ? 'text-main-600 underline' : 'text-content-secondary']">
              {{ style.name.includes('Link') ? 'View details' : 'Supporting text' }}
            </span>
          </div>
          <div class="w-32 shrink-0">
            <span class="text-label text-content-tertiary">{{ style.usage }}</span>
          </div>
          <button
            class="relative w-28 shrink-0 text-left"
            @click="copyToClipboard(style.cssClass)"
          >
            <code class="text-label text-main-600 dark:text-main-400 hover:text-main-700 dark:hover:text-main-300 transition-colors">
              {{ style.cssClass }}
            </code>
            <span v-if="copiedValue === style.cssClass" class="absolute -top-5 left-0 text-suggestion-bold text-main-500">
              Copied!
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- Small Text -->
    <div class="docs-section">
      <h2 class="docs-section-title">Small Text</h2>
      <div class="space-y-2">
        <div
          v-for="style in smallStyles"
          :key="style.name"
          class="flex items-center gap-4 py-2 hover:bg-surface-raised -mx-2 px-2 rounded transition-colors"
        >
          <div class="w-14 shrink-0">
            <span class="text-label text-content-tertiary">{{ style.size }}</span>
          </div>
          <div class="w-24 shrink-0">
            <span :class="[style.cssClass, 'text-content-primary']">{{ style.name }}</span>
          </div>
          <div class="flex-1">
            <span :class="[style.cssClass, 'text-content-secondary']">Fine print or caption text</span>
          </div>
          <div class="w-32 shrink-0">
            <span class="text-label text-content-tertiary">{{ style.usage }}</span>
          </div>
          <button
            class="relative w-28 shrink-0 text-left"
            @click="copyToClipboard(style.cssClass)"
          >
            <code class="text-label text-main-600 dark:text-main-400 hover:text-main-700 dark:hover:text-main-300 transition-colors">
              {{ style.cssClass }}
            </code>
            <span v-if="copiedValue === style.cssClass" class="absolute -top-5 left-0 text-suggestion-bold text-main-500">
              Copied!
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- Prohibited Patterns -->
    <div class="docs-section">
      <h2 class="docs-section-title">Prohibited Patterns</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        The following patterns are <strong>never allowed</strong>. Use the design system tokens instead.
      </p>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div class="p-3 bg-error-50 dark:bg-error-950 border border-error-200 dark:border-error-800 rounded-lg">
          <p class="text-label-bold text-error-700 dark:text-error-400">Raw Font Sizes</p>
          <p class="text-label text-error-600 dark:text-error-300 mt-1">text-xs, text-sm, text-base, text-lg, text-xl, text-2xl...</p>
        </div>
        <div class="p-3 bg-error-50 dark:bg-error-950 border border-error-200 dark:border-error-800 rounded-lg">
          <p class="text-label-bold text-error-700 dark:text-error-400">Monospace Font</p>
          <p class="text-label text-error-600 dark:text-error-300 mt-1"> (even for numbers)</p>
        </div>
        <div class="p-3 bg-error-50 dark:bg-error-950 border border-error-200 dark:border-error-800 rounded-lg">
          <p class="text-label-bold text-error-700 dark:text-error-400">Serif Fonts</p>
          <p class="text-label text-error-600 dark:text-error-300 mt-1">font-serif</p>
        </div>
        <div class="p-3 bg-error-50 dark:bg-error-950 border border-error-200 dark:border-error-800 rounded-lg">
          <p class="text-label-bold text-error-700 dark:text-error-400">Arbitrary Values</p>
          <p class="text-label text-error-600 dark:text-error-300 mt-1">text-[16px], text-[1.5rem]...</p>
        </div>
      </div>
    </div>

    <!-- Usage Guidelines -->
    <div class="docs-section-last">
      <h2 class="docs-section-title">Usage Guidelines</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <p class="text-body-regular font-medium text-content-primary mb-2">Hierarchy</p>
          <ul class="space-y-1 text-body-regular text-content-secondary">
            <li>• Use H1 only once per page</li>
            <li>• Progress sequentially (H1 → H2 → H3)</li>
            <li>• Body styles for paragraphs</li>
            <li>• Labels for supporting text</li>
          </ul>
        </div>
        <div>
          <p class="text-body-regular font-medium text-content-primary mb-2">Accessibility</p>
          <ul class="space-y-1 text-body-regular text-content-secondary">
            <li>• Minimum 14px for body text</li>
            <li>• Line height 1.36 for readability</li>
            <li>• 10px text for non-essential info only</li>
            <li>• Ensure sufficient color contrast</li>
          </ul>
        </div>
        <div>
          <p class="text-body-regular font-medium text-content-primary mb-2">Numerical Data</p>
          <ul class="space-y-1 text-body-regular text-content-secondary">
            <li>• Use body-regular or label for numbers</li>
            <li>• No monospace font required</li>
            <li>• Right-align in tables for scanning</li>
            <li>• Follow data formatting rules</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
