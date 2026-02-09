import type { Config } from "tailwindcss";

/**
 * Design System Tokens - 8020 Platform Family
 *
 * NAMING CONVENTIONS (for scalability):
 * - All color tokens use semantic names, not color names (e.g., "main" not "green")
 * - This allows brand customization without code changes
 * - Shades follow standard scale: 50, 100, 300, 500, 700, 900, 950
 *
 * COLOR STRUCTURE:
 * - main: Primary brand color (green for Roofing8020, changeable per brand)
 * - accent-1 to accent-5: Five accent palettes for variety (charts, highlights)
 * - neutral: Gray scale for text, backgrounds, borders
 * - black/white: Pure black and white only
 * - success, alert, error, info: Semantic status colors
 *
 * USAGE:
 * - bg-main-500, text-accent-1-700, border-neutral-200
 * - Never use raw color names like "blue" or "green" in components
 */

export default {
  // Enable class-based dark mode (toggle via .dark class on <html>)
  darkMode: "class",

  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./app.vue",
    "./error.vue",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      // ============================================
      // BORDER RADIUS - Corner rounding scale
      // Used for: cards, buttons, inputs, badges
      // ============================================
      borderRadius: {
        none: "0px",
        xs: "2px",
        sm: "4px",
        DEFAULT: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        "2xl": "24px",
        "3xl": "32px",
        "4xl": "40px",
        full: "9999px",
      },

      fontSize: {
        // ============================================
        // TYPOGRAPHY SCALE - Material Design Inspired
        // Line heights: 1.5 for body (readability), 1.3 for headings (tighter)
        // ============================================

        // Headlines - tighter line height for visual impact
        "h1-alt": ["24px", { lineHeight: "1.3", letterSpacing: "-0.5px", fontWeight: "600" }],
        "h1": ["22px", { lineHeight: "1.3", letterSpacing: "-0.5px", fontWeight: "600" }],
        "h2": ["20px", { lineHeight: "1.3", letterSpacing: "-0.3px", fontWeight: "600" }],
        "h3": ["18px", { lineHeight: "1.35", letterSpacing: "-0.2px", fontWeight: "600" }],
        "h4": ["16px", { lineHeight: "1.4", fontWeight: "600" }],
        "h5": ["14px", { lineHeight: "1.4", fontWeight: "600" }],
        "h6": ["12px", { lineHeight: "1.4", fontWeight: "500" }],
        "h7": ["10px", { lineHeight: "1.4", fontWeight: "600" }],

        // Body - looser line height for readability
        "body-large": ["16px", { lineHeight: "1.5", fontWeight: "400" }],
        "body-regular": ["14px", { lineHeight: "1.5", fontWeight: "400" }],

        // Buttons - medium line height
        "button-large": ["16px", { lineHeight: "1.4", fontWeight: "500" }],
        "button-regular": ["14px", { lineHeight: "1.4", fontWeight: "500" }],
        "button-small": ["12px", { lineHeight: "1.4", fontWeight: "500" }],

        // Labels & Links
        "label": ["12px", { lineHeight: "1.4", fontWeight: "400" }],
        "label-bold": ["12px", { lineHeight: "1.4", fontWeight: "500" }],
        "link": ["14px", { lineHeight: "1.5", fontWeight: "400" }],
        "link-small": ["12px", { lineHeight: "1.4", fontWeight: "400" }],

        // Small text - use sparingly (badges, tags, timestamps only)
        "suggestion": ["10px", { lineHeight: "1.4", fontWeight: "400" }],
        "suggestion-bold": ["10px", { lineHeight: "1.4", fontWeight: "600" }],
      },
      colors: {
        // ============================================
        // MAIN - Primary Brand Color
        // Currently: Green (Roofing8020)
        // Change this for different brands
        // ============================================
        main: {
          50: "#f0fdf4",
          100: "#dcfce7",
          300: "#86efac",
          500: "#22c55e",
          700: "#15803d",
          900: "#14532d",
          950: "#052e16",
        },

        // ============================================
        // ACCENT COLORS - 5 palettes for variety
        // Used for: charts, data visualization, highlights
        // ============================================

        // Accent 1 - Blue tones
        "accent-1": {
          50: "#eff6ff",
          100: "#dbeafe",
          300: "#93c5fd",
          500: "#3b82f6",
          700: "#1d4ed8",
          900: "#1e3a8a",
          950: "#172554",
        },

        // Accent 2 - Indigo/Purple tones
        "accent-2": {
          50: "#eef2ff",
          100: "#e0e7ff",
          300: "#a5b4fc",
          500: "#6366f1",
          700: "#4338ca",
          900: "#312e81",
          950: "#1e1b4b",
        },

        // Accent 3 - Orange tones
        "accent-3": {
          50: "#fff7ed",
          100: "#ffedd5",
          300: "#fdba74",
          500: "#f97316",
          700: "#c2410c",
          900: "#7c2d12",
          950: "#431407",
        },

        // Accent 4 - Lime tones
        "accent-4": {
          50: "#f7fee7",
          100: "#ecfccb",
          300: "#bef264",
          500: "#84cc16",
          700: "#4d7c0f",
          900: "#365314",
          950: "#1a2e05",
        },

        // Accent 5 - Pink/Magenta tones
        "accent-5": {
          50: "#fdf2f8",
          100: "#fce7f3",
          300: "#f9a8d4",
          500: "#ec4899",
          700: "#be185d",
          900: "#831843",
          950: "#500724",
        },

        // ============================================
        // NEUTRAL - Gray scale
        // Used for: text, backgrounds, borders, disabled states
        // ============================================
        neutral: {
          50: "#f9fafb",
          100: "#f3f4f6",
          200: "#e5e7eb",
          300: "#d1d5db",
          400: "#9ca3af",
          500: "#6b7280",
          600: "#4b5563",
          700: "#374151",
          800: "#1f2937",
          900: "#111827",
          950: "#030712",
        },

        // ============================================
        // BLACK & WHITE - Pure values only
        // ============================================
        white: "#ffffff",
        black: "#000000",

        // ============================================
        // SEMANTIC STATUS COLORS
        // Used for: feedback, states, validation
        // ============================================

        // Success - Positive feedback, confirmations
        success: {
          50: "#f0fdf4",
          100: "#dcfce7",
          300: "#86efac",
          500: "#22c55e",
          700: "#15803d",
          900: "#14532d",
          950: "#052e16",
        },

        // Alert - Warnings, cautions
        alert: {
          50: "#fefce8",
          100: "#fef9c3",
          300: "#fde047",
          500: "#eab308",
          700: "#a16207",
          900: "#713f12",
          950: "#422006",
        },

        // Error - Errors, destructive actions
        error: {
          50: "#fef2f2",
          100: "#fee2e2",
          300: "#fca5a5",
          500: "#ef4444",
          700: "#b91c1c",
          900: "#7f1d1d",
          950: "#450a0a",
        },

        // Info - Informational, neutral feedback
        info: {
          50: "#ecfeff",
          100: "#cffafe",
          300: "#67e8f9",
          500: "#06b6d4",
          700: "#0e7490",
          900: "#164e63",
          950: "#083344",
        },

        // ============================================
        // LEGACY ALIASES - For backward compatibility
        // TODO: Migrate these usages to semantic names
        // ============================================
        accent: {
          50: "#eef2ff",
          100: "#e0e7ff",
          300: "#a5b4fc",
          500: "#6366f1",
          700: "#4338ca",
          900: "#312e81",
          950: "#1e1b4b",
        },
        brand: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
          950: "#052e16",
        },

        // ============================================
        // SEMANTIC THEME TOKENS (CSS Variable-based)
        // These automatically adapt to light/dark mode
        // ============================================

        // Surface colors - Backgrounds & containers
        surface: {
          base: "var(--surface-base)",
          raised: "var(--surface-raised)",
          overlay: "var(--surface-overlay)",
          sunken: "var(--surface-sunken)",
        },

        // Content colors - Text hierarchy
        content: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          tertiary: "var(--text-tertiary)",
          disabled: "var(--text-disabled)",
          inverse: "var(--text-inverse)",
        },

        // Stroke colors - Borders & dividers
        stroke: {
          DEFAULT: "var(--border-default)",
          subtle: "var(--border-subtle)",
          strong: "var(--border-strong)",
        },
      },

      // ============================================
      // SHADOWS - CSS Variable-based for theme support
      // ============================================
      boxShadow: {
        none: "none",
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        DEFAULT: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
      },
    },
  },
  plugins: [],
} satisfies Config;
