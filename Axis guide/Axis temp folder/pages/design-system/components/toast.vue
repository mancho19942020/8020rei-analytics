<script setup lang="ts">
import {
  CheckIcon,
  ArrowPathIcon,
} from "@heroicons/vue/24/outline";

definePageMeta({
  layout: "design-system",
});

useHead({
  title: "Toast | Components | Design System | 8020",
});

// ============================================
// TOAST SPECIFICATION - AXIS DESIGN SYSTEM
// Source of truth - NO EXCEPTIONS
// ============================================

const { showToast } = useToast();

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

// Demo handlers
const handleSimpleToast = (type: "info" | "success" | "warning" | "error") => {
  const messages = {
    info: "This is an informational message",
    success: "Changes saved successfully",
    warning: "Please review before continuing",
    error: "An error occurred. Please try again",
  };
  showToast(messages[type], type);
};

const handleTitleToast = () => {
  showToast({
    title: "Upload Complete",
    message: "Your file has been uploaded successfully",
    type: "success",
  });
};

const handleActionToast = () => {
  showToast({
    title: "Connection Failed",
    message: "Unable to connect to the server",
    type: "error",
    action: {
      label: "Retry",
      handler: () => {
        showToast("Retrying connection...", "info");
      },
    },
    duration: 0, // Don't auto-dismiss
  });
};

const handleLinkToast = () => {
  showToast({
    title: "New Feature Available",
    message: "Check out the latest updates",
    type: "info",
    link: {
      label: "Learn more",
      handler: () => {
        showToast("Opening documentation...", "info");
      },
    },
  });
};

const handleLongDuration = () => {
  showToast({
    message: "This toast will stay for 10 seconds",
    type: "info",
    duration: 10000,
  });
};

const handleMultipleToasts = () => {
  showToast("First toast", "info");
  setTimeout(() => showToast("Second toast", "success"), 300);
  setTimeout(() => showToast("Third toast", "warning"), 600);
  setTimeout(() => showToast("Fourth toast", "error"), 900);
};

// Code examples
const codeExamples = {
  setup: `// In your app.vue or default.vue layout
<template>
  <div>
    <slot />
    <AxisToastContainer />
  </div>
</template>`,
  basic: `const { showToast } = useToast()

// Simple string message
showToast('Changes saved', 'success')`,
  withTitle: `const { showToast } = useToast()

showToast({
  title: 'Upload Complete',
  message: 'Your file has been uploaded successfully',
  type: 'success'
})`,
  types: `const { showToast } = useToast()

// Info (default)
showToast('Processing started', 'info')

// Success
showToast('Changes saved', 'success')

// Warning
showToast('Storage nearly full', 'warning')

// Error
showToast('Failed to connect', 'error')`,
  withAction: `const { showToast } = useToast()

showToast({
  title: 'Connection Failed',
  message: 'Unable to connect to server',
  type: 'error',
  action: {
    label: 'Retry',
    handler: () => retryConnection()
  },
  duration: 0 // Don't auto-dismiss with actions
})`,
  withLink: `const { showToast } = useToast()

showToast({
  title: 'New Feature Available',
  message: 'Check out the latest updates',
  type: 'info',
  link: {
    label: 'Learn more',
    handler: () => navigateTo('/docs')
  }
})`,
  customDuration: `const { showToast } = useToast()

// Short duration (2 seconds)
showToast({
  message: 'Quick notification',
  type: 'info',
  duration: 2000
})

// Long duration (10 seconds)
showToast({
  message: 'Important information',
  type: 'warning',
  duration: 10000
})

// No auto-dismiss
showToast({
  message: 'Requires manual dismissal',
  type: 'error',
  duration: 0
})`,
};
</script>

<template>
  <div>
    <!-- Header -->
    <div class="docs-section">
      <h1 class="text-h2 text-content-primary">Toast</h1>
      <p class="text-body-regular text-content-secondary">
        Transient notification components for brief, non-blocking feedback messages that auto-dismiss.
      </p>
    </div>

    <!-- Overview -->
    <div class="docs-section-highlight">
      <h2 class="text-h4 text-content-primary mb-2">Overview</h2>
      <p class="text-body-regular text-content-secondary mb-3">
        Toasts provide brief, transient feedback about operations. They appear temporarily at the top-right
        of the screen, auto-dismiss after a few seconds, and don't interrupt the user's workflow. Use them
        for confirmations, completions, and non-critical updates.
      </p>
      <div class="flex flex-wrap gap-3">
        <AxisButton variant="outlined" size="sm" @click="handleSimpleToast('success')">
          Show Success Toast
        </AxisButton>
        <AxisButton variant="outlined" size="sm" @click="handleTitleToast">
          Show with Title
        </AxisButton>
        <AxisButton variant="outlined" size="sm" @click="handleMultipleToasts">
          Show Multiple
        </AxisButton>
      </div>
    </div>

    <!-- MANDATORY RULE Notice -->
    <div class="docs-section">
      <AxisCallout type="warning" title="Mandatory Rule - No Exceptions">
        All transient user feedback MUST use the <code class="bg-alert-100 dark:bg-alert-900 px-1 rounded">useToast()</code> composable.
        Custom toast implementations are <strong>strictly prohibited</strong>.
      </AxisCallout>
    </div>

    <!-- ============================================ -->
    <!-- SETUP -->
    <!-- ============================================ -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-2">Setup</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Add the <code class="bg-surface-raised dark:bg-neutral-800 px-1 rounded">AxisToastContainer</code>
        component to your app layout once. This enables toast functionality globally.
      </p>

      <div class="border border-stroke rounded-lg overflow-hidden">
        <div class="px-4 py-2 bg-surface-raised border-b border-stroke flex items-center justify-between">
          <span class="text-label-bold text-content-secondary">app.vue or default.vue</span>
          <button
            class="text-label text-main-700 dark:text-main-400 hover:text-main-900 dark:hover:text-main-200"
            @click="copyToClipboard(codeExamples.setup)"
          >
            {{ copiedCode === codeExamples.setup ? 'Copied!' : 'Copy' }}
          </button>
        </div>
        <pre class="p-4 text-label bg-neutral-900 overflow-x-auto"><code class="text-neutral-100">{{ codeExamples.setup }}</code></pre>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- TYPES -->
    <!-- ============================================ -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-2">Types</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Four semantic types to communicate different levels of feedback.
      </p>

      <div class="space-y-4">
        <!-- Info -->
        <div class="p-4 bg-surface-base border border-stroke rounded-lg">
          <div class="flex items-start justify-between mb-3">
            <div class="flex-1">
              <h3 class="text-body-regular font-medium text-content-primary">Info (Default)</h3>
              <p class="text-label text-content-secondary">General notifications, process updates, neutral confirmations.</p>
            </div>
            <div class="flex items-center gap-3">
              <code class="text-label bg-surface-raised dark:bg-neutral-800 px-2 py-1 rounded text-content-secondary">type="info"</code>
              <AxisButton variant="ghost" size="sm" @click="handleSimpleToast('info')">
                Demo
              </AxisButton>
            </div>
          </div>
        </div>

        <!-- Success -->
        <div class="p-4 bg-surface-base border border-stroke rounded-lg">
          <div class="flex items-start justify-between mb-3">
            <div class="flex-1">
              <h3 class="text-body-regular font-medium text-content-primary">Success</h3>
              <p class="text-label text-content-secondary">Successful actions, completions, positive confirmations.</p>
            </div>
            <div class="flex items-center gap-3">
              <code class="text-label bg-surface-raised dark:bg-neutral-800 px-2 py-1 rounded text-content-secondary">type="success"</code>
              <AxisButton variant="ghost" size="sm" @click="handleSimpleToast('success')">
                Demo
              </AxisButton>
            </div>
          </div>
        </div>

        <!-- Warning -->
        <div class="p-4 bg-surface-base border border-stroke rounded-lg">
          <div class="flex items-start justify-between mb-3">
            <div class="flex-1">
              <h3 class="text-body-regular font-medium text-content-primary">Warning</h3>
              <p class="text-label text-content-secondary">Cautions, important notices, non-critical issues.</p>
            </div>
            <div class="flex items-center gap-3">
              <code class="text-label bg-surface-raised dark:bg-neutral-800 px-2 py-1 rounded text-content-secondary">type="warning"</code>
              <AxisButton variant="ghost" size="sm" @click="handleSimpleToast('warning')">
                Demo
              </AxisButton>
            </div>
          </div>
        </div>

        <!-- Error -->
        <div class="p-4 bg-surface-base border border-stroke rounded-lg">
          <div class="flex items-start justify-between mb-3">
            <div class="flex-1">
              <h3 class="text-body-regular font-medium text-content-primary">Error</h3>
              <p class="text-label text-content-secondary">Failed actions, errors, critical issues (non-blocking).</p>
            </div>
            <div class="flex items-center gap-3">
              <code class="text-label bg-surface-raised dark:bg-neutral-800 px-2 py-1 rounded text-content-secondary">type="error"</code>
              <AxisButton variant="ghost" size="sm" @click="handleSimpleToast('error')">
                Demo
              </AxisButton>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- WITH TITLE -->
    <!-- ============================================ -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-2">With Title</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Add a title for emphasis and context. The title appears in bold above the message.
      </p>

      <div class="p-4 bg-surface-base border border-stroke rounded-lg">
        <div class="flex items-start justify-between mb-3">
          <div>
            <h3 class="text-body-regular font-medium text-content-primary">Title + Message</h3>
            <p class="text-label text-content-secondary">Use titles for clarity when the action needs more context.</p>
          </div>
          <AxisButton variant="ghost" size="sm" @click="handleTitleToast">
            Demo
          </AxisButton>
        </div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- WITH ACTIONS -->
    <!-- ============================================ -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-2">With Actions</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Add action buttons or links for immediate follow-up actions. Actions and links are mutually exclusive.
      </p>

      <div class="space-y-4">
        <!-- Action button -->
        <div class="p-4 bg-surface-base border border-stroke rounded-lg">
          <div class="flex items-start justify-between mb-3">
            <div>
              <h3 class="text-body-regular font-medium text-content-primary">Action Button</h3>
              <p class="text-label text-content-secondary">
                Use for immediate retry or undo actions. Set <code class="bg-surface-raised dark:bg-neutral-800 px-1 rounded">duration: 0</code> to prevent auto-dismiss.
              </p>
            </div>
            <AxisButton variant="ghost" size="sm" @click="handleActionToast">
              Demo
            </AxisButton>
          </div>
        </div>

        <!-- Link -->
        <div class="p-4 bg-surface-base border border-stroke rounded-lg">
          <div class="flex items-start justify-between mb-3">
            <div>
              <h3 class="text-body-regular font-medium text-content-primary">Link Text</h3>
              <p class="text-label text-content-secondary">Use for navigation to more details or related content.</p>
            </div>
            <AxisButton variant="ghost" size="sm" @click="handleLinkToast">
              Demo
            </AxisButton>
          </div>
        </div>
      </div>

      <div class="mt-4 p-3 bg-alert-50 dark:bg-alert-900/30 border border-alert-200 dark:border-alert-800 rounded-lg">
        <p class="text-label text-alert-800 dark:text-alert-300">
          <strong>Best Practice:</strong> Toasts with actions should not auto-dismiss (set <code class="bg-alert-100 dark:bg-alert-900 px-1 rounded">duration: 0</code>).
          Users need time to read and interact with the action.
        </p>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- DURATION -->
    <!-- ============================================ -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-2">Duration</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Control how long toasts remain visible. Default is 4 seconds (4000ms).
      </p>

      <div class="space-y-4">
        <div class="p-4 bg-surface-base border border-stroke rounded-lg">
          <div class="flex items-start justify-between mb-3">
            <div>
              <h3 class="text-body-regular font-medium text-content-primary">Custom Duration</h3>
              <p class="text-label text-content-secondary">
                Default: 4000ms (4 seconds). Adjust based on message length and importance.
              </p>
            </div>
            <AxisButton variant="ghost" size="sm" @click="handleLongDuration">
              Demo 10s
            </AxisButton>
          </div>
          <ul class="mt-3 space-y-1 text-label text-content-secondary">
            <li>• Short messages: 2-3 seconds</li>
            <li>• Default: 4 seconds</li>
            <li>• Important messages: 6-10 seconds</li>
            <li>• With actions: 0 (no auto-dismiss)</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- STACKING -->
    <!-- ============================================ -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-2">Stacking Behavior</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Multiple toasts stack vertically with a maximum of 5 visible at once. Oldest toasts dismiss first (FIFO).
      </p>

      <div class="p-4 bg-surface-base border border-stroke rounded-lg">
        <div class="flex items-start justify-between mb-3">
          <div>
            <h3 class="text-body-regular font-medium text-content-primary">Multiple Toasts</h3>
            <p class="text-label text-content-secondary">
              Click to see multiple toasts stack. Maximum 5 visible, oldest auto-removes.
            </p>
          </div>
          <AxisButton variant="ghost" size="sm" @click="handleMultipleToasts">
            Demo
          </AxisButton>
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
              <span>Keep messages brief (3-6 words ideal)</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Use for confirmations ("Changes saved", "View created")</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Use sentence case without periods</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Disable auto-dismiss when actions are present</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Use for background operations ("Export started")</span>
            </li>
          </ul>
        </div>

        <!-- Don'ts -->
        <div>
          <h3 class="text-h5 text-error-700 dark:text-error-400 mb-3">Don't</h3>
          <ul class="space-y-2 text-body-regular text-content-secondary">
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Use for critical errors requiring user action</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Include multiple actions or complex interactions</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Write long messages (use AxisCallout instead)</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Show multiple toasts simultaneously for the same action</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Use for information that needs to persist</span>
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
              <td class="py-3 pr-4">Save confirmation</td>
              <td class="py-3 pr-4"><code class="text-label bg-success-100 dark:bg-success-900 px-1.5 py-0.5 rounded text-success-700 dark:text-success-300">AxisToast</code></td>
              <td class="py-3 text-label">Brief confirmation, auto-dismisses</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-3 pr-4">Filter applied</td>
              <td class="py-3 pr-4"><code class="text-label bg-success-100 dark:bg-success-900 px-1.5 py-0.5 rounded text-success-700 dark:text-success-300">AxisToast</code></td>
              <td class="py-3 text-label">Quick feedback, doesn't interrupt workflow</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-3 pr-4">Form validation errors</td>
              <td class="py-3 pr-4"><code class="text-label bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-700 dark:text-neutral-300">AxisCallout</code></td>
              <td class="py-3 text-label">Must persist while user fixes issues</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-3 pr-4">Background operation started</td>
              <td class="py-3 pr-4"><code class="text-label bg-success-100 dark:bg-success-900 px-1.5 py-0.5 rounded text-success-700 dark:text-success-300">AxisToast</code></td>
              <td class="py-3 text-label">Informs user, doesn't block work</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-3 pr-4">Critical error requiring action</td>
              <td class="py-3 pr-4"><code class="text-label bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-700 dark:text-neutral-300">AxisCallout</code></td>
              <td class="py-3 text-label">Needs to persist, requires user action</td>
            </tr>
            <tr>
              <td class="py-3 pr-4">Item added to list</td>
              <td class="py-3 pr-4"><code class="text-label bg-success-100 dark:bg-success-900 px-1.5 py-0.5 rounded text-success-700 dark:text-success-300">AxisToast</code></td>
              <td class="py-3 text-label">Success feedback, transient</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- CONTENT GUIDELINES -->
    <!-- ============================================ -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-3">Content Guidelines</h2>

      <div class="space-y-4">
        <div class="p-4 bg-surface-raised border border-stroke rounded-lg">
          <h3 class="text-body-regular font-medium text-content-primary mb-2">Keep it brief</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p class="text-label text-success-700 dark:text-success-400 font-medium mb-1">✓ Good</p>
              <ul class="text-label text-content-secondary space-y-1">
                <li>• "Changes saved"</li>
                <li>• "View created"</li>
                <li>• "Filter applied"</li>
                <li>• "Export started"</li>
              </ul>
            </div>
            <div>
              <p class="text-label text-error-700 dark:text-error-400 font-medium mb-1">✗ Too verbose</p>
              <ul class="text-label text-content-secondary space-y-1">
                <li>• "Your changes have been saved successfully to the database"</li>
                <li>• "A new view has been created with the name you provided"</li>
                <li>• "The filter has been applied to the property list"</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="p-4 bg-surface-raised border border-stroke rounded-lg">
          <h3 class="text-body-regular font-medium text-content-primary mb-2">Use sentence case, omit punctuation</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p class="text-label text-success-700 dark:text-success-400 font-medium mb-1">✓ Good</p>
              <ul class="text-label text-content-secondary space-y-1">
                <li>• "Property updated"</li>
                <li>• "Connection restored"</li>
                <li>• "Settings saved"</li>
              </ul>
            </div>
            <div>
              <p class="text-label text-error-700 dark:text-error-400 font-medium mb-1">✗ Incorrect</p>
              <ul class="text-label text-content-secondary space-y-1">
                <li>• "Property Updated." (title case + period)</li>
                <li>• "Connection Restored!" (title case + exclamation)</li>
                <li>• "settings saved" (lowercase)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- API REFERENCE -->
    <!-- ============================================ -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-3">API Reference</h2>

      <!-- useToast() Composable -->
      <h3 class="text-body-regular font-medium text-content-primary mb-2">useToast() Composable</h3>
      <div class="overflow-x-auto mb-6">
        <table class="w-full text-left">
          <thead>
            <tr class="border-b border-stroke">
              <th class="py-2 pr-4 text-label-bold text-content-secondary">Method</th>
              <th class="py-2 pr-4 text-label-bold text-content-secondary">Parameters</th>
              <th class="py-2 text-label-bold text-neutral-700 dark:text-neutral-300">Description</th>
            </tr>
          </thead>
          <tbody class="text-body-regular text-content-secondary">
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">showToast</code></td>
              <td class="py-2 pr-4 text-label">message: string, type?: string</td>
              <td class="py-2 text-label">Show a simple toast with message and type</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">showToast</code></td>
              <td class="py-2 pr-4 text-label">options: ToastOptions</td>
              <td class="py-2 text-label">Show a toast with full options (title, action, duration)</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">dismissToast</code></td>
              <td class="py-2 pr-4 text-label">id: string</td>
              <td class="py-2 text-label">Dismiss a specific toast by ID</td>
            </tr>
            <tr>
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">dismissAll</code></td>
              <td class="py-2 pr-4 text-label">none</td>
              <td class="py-2 text-label">Dismiss all active toasts</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ToastOptions -->
      <h3 class="text-body-regular font-medium text-content-primary mb-2">ToastOptions</h3>
      <div class="overflow-x-auto mb-6">
        <table class="w-full text-left">
          <thead>
            <tr class="border-b border-stroke">
              <th class="py-2 pr-4 text-label-bold text-content-secondary">Property</th>
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
              <td class="py-2 text-label">Toast type determines color scheme and icon</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">title</code></td>
              <td class="py-2 pr-4 text-label">string</td>
              <td class="py-2 pr-4 text-label">undefined</td>
              <td class="py-2 text-label">Optional title displayed in bold</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">message</code></td>
              <td class="py-2 pr-4 text-label">string</td>
              <td class="py-2 pr-4 text-label">required</td>
              <td class="py-2 text-label">Message body text</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">duration</code></td>
              <td class="py-2 pr-4 text-label">number</td>
              <td class="py-2 pr-4 text-label">4000</td>
              <td class="py-2 text-label">Auto-dismiss duration in ms (0 = no auto-dismiss)</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">action</code></td>
              <td class="py-2 pr-4 text-label">{ label: string, handler: () => void }</td>
              <td class="py-2 pr-4 text-label">undefined</td>
              <td class="py-2 text-label">Optional action button</td>
            </tr>
            <tr>
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">link</code></td>
              <td class="py-2 pr-4 text-label">{ label: string, handler: () => void }</td>
              <td class="py-2 pr-4 text-label">undefined</td>
              <td class="py-2 text-label">Optional link text (mutually exclusive with action)</td>
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
          <h3 class="text-body-regular font-medium text-info-900 dark:text-info-100 mb-2">ARIA Roles & Live Regions</h3>
          <ul class="text-label text-info-800 dark:text-info-300 space-y-1">
            <li><strong>Info/Success:</strong> <code class="bg-info-100 dark:bg-info-900 px-1 rounded">role="status"</code>, <code class="bg-info-100 dark:bg-info-900 px-1 rounded">aria-live="polite"</code></li>
            <li><strong>Warning/Error:</strong> <code class="bg-info-100 dark:bg-info-900 px-1 rounded">role="alert"</code>, <code class="bg-info-100 dark:bg-info-900 px-1 rounded">aria-live="assertive"</code></li>
            <li><strong>Dismiss button:</strong> <code class="bg-info-100 dark:bg-info-900 px-1 rounded">aria-label="Dismiss notification"</code></li>
          </ul>
        </div>

        <div class="p-4 bg-surface-raised border border-stroke rounded-lg">
          <h3 class="text-body-regular font-medium text-content-primary mb-2">Screen Reader Considerations</h3>
          <ul class="text-label text-content-secondary space-y-1">
            <li>• Icons are <code class="bg-surface-raised dark:bg-neutral-700 px-1 rounded">aria-hidden="true"</code></li>
            <li>• Auto-dismiss duration provides sufficient time for announcement</li>
            <li>• Keep messages brief for quick comprehension</li>
            <li>• Avoid complex interactive content inside toasts</li>
          </ul>
        </div>

        <div class="p-4 bg-success-50 dark:bg-success-950 border border-success-200 dark:border-success-800 rounded-lg">
          <h3 class="text-body-regular font-medium text-success-900 dark:text-success-100 mb-2">Motion & Contrast</h3>
          <ul class="text-label text-success-800 dark:text-success-300 space-y-1">
            <li>• Animations respect <code class="bg-success-100 dark:bg-success-900 px-1 rounded">prefers-reduced-motion</code></li>
            <li>• All text colors meet WCAG AA contrast requirements</li>
            <li>• Color is not the only means of conveying information (icons + text)</li>
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
        <!-- Setup -->
        <div class="border border-stroke rounded-lg overflow-hidden">
          <div class="px-4 py-2 bg-surface-raised border-b border-stroke flex items-center justify-between">
            <span class="text-label-bold text-content-secondary">Setup (app.vue or layout)</span>
            <button
              class="text-label text-main-700 dark:text-main-400 hover:text-main-900 dark:hover:text-main-200"
              @click="copyToClipboard(codeExamples.setup)"
            >
              {{ copiedCode === codeExamples.setup ? 'Copied!' : 'Copy' }}
            </button>
          </div>
          <pre class="p-4 text-label bg-neutral-900 overflow-x-auto"><code class="text-neutral-100">{{ codeExamples.setup }}</code></pre>
        </div>

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

        <!-- With Action -->
        <div class="border border-stroke rounded-lg overflow-hidden">
          <div class="px-4 py-2 bg-surface-raised border-b border-stroke flex items-center justify-between">
            <span class="text-label-bold text-content-secondary">With Action Button</span>
            <button
              class="text-label text-main-700 dark:text-main-400 hover:text-main-900 dark:hover:text-main-200"
              @click="copyToClipboard(codeExamples.withAction)"
            >
              {{ copiedCode === codeExamples.withAction ? 'Copied!' : 'Copy' }}
            </button>
          </div>
          <pre class="p-4 text-label bg-neutral-900 overflow-x-auto"><code class="text-neutral-100">{{ codeExamples.withAction }}</code></pre>
        </div>

        <!-- With Link -->
        <div class="border border-stroke rounded-lg overflow-hidden">
          <div class="px-4 py-2 bg-surface-raised border-b border-stroke flex items-center justify-between">
            <span class="text-label-bold text-content-secondary">With Link</span>
            <button
              class="text-label text-main-700 dark:text-main-400 hover:text-main-900 dark:hover:text-main-200"
              @click="copyToClipboard(codeExamples.withLink)"
            >
              {{ copiedCode === codeExamples.withLink ? 'Copied!' : 'Copy' }}
            </button>
          </div>
          <pre class="p-4 text-label bg-neutral-900 overflow-x-auto"><code class="text-neutral-100">{{ codeExamples.withLink }}</code></pre>
        </div>

        <!-- Custom Duration -->
        <div class="border border-stroke rounded-lg overflow-hidden">
          <div class="px-4 py-2 bg-surface-raised border-b border-stroke flex items-center justify-between">
            <span class="text-label-bold text-content-secondary">Custom Duration</span>
            <button
              class="text-label text-main-700 dark:text-main-400 hover:text-main-900 dark:hover:text-main-200"
              @click="copyToClipboard(codeExamples.customDuration)"
            >
              {{ copiedCode === codeExamples.customDuration ? 'Copied!' : 'Copy' }}
            </button>
          </div>
          <pre class="p-4 text-label bg-neutral-900 overflow-x-auto"><code class="text-neutral-100">{{ codeExamples.customDuration }}</code></pre>
        </div>
      </div>
    </div>
  </div>
</template>
