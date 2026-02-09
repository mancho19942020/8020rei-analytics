/**
 * Theme Management Composable
 *
 * Provides reactive theme state with:
 * - System preference detection
 * - localStorage persistence
 * - SSR-safe implementation
 * - No flash of wrong theme (FOUC prevention via inline script in nuxt.config)
 *
 * USAGE:
 * const { isDark, toggleTheme, setTheme, preference } = useTheme()
 *
 * // Toggle between light and dark
 * toggleTheme()
 *
 * // Set specific theme
 * setTheme('dark') // or 'light' or 'system'
 *
 * // Check current state
 * if (isDark.value) { ... }
 */

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "theme-preference";

export const useTheme = () => {
  // User's preference (what they chose)
  const preference = useState<ThemePreference>("theme-preference", () => "system");

  // System preference (detected from OS)
  const systemPreference = useState<ResolvedTheme>("system-theme", () => "light");

  // Resolved theme (what's actually showing)
  const resolvedTheme = computed<ResolvedTheme>(() => {
    if (preference.value === "system") {
      return systemPreference.value;
    }
    return preference.value;
  });

  // Convenience boolean
  const isDark = computed(() => resolvedTheme.value === "dark");

  // Apply the .dark class to <html>
  const applyThemeClass = () => {
    if (!import.meta.client) return;

    const root = document.documentElement;
    const shouldBeDark = resolvedTheme.value === "dark";

    root.classList.toggle("dark", shouldBeDark);

    // Update meta theme-color for mobile browsers
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement("meta");
      metaThemeColor.setAttribute("name", "theme-color");
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute("content", shouldBeDark ? "#030712" : "#ffffff");
  };

  // Set theme preference
  const setTheme = (theme: ThemePreference) => {
    preference.value = theme;

    if (import.meta.client) {
      localStorage.setItem(STORAGE_KEY, theme);
      applyThemeClass();
    }
  };

  // Toggle between light and dark (ignores system)
  const toggleTheme = () => {
    setTheme(isDark.value ? "light" : "dark");
  };

  // Cycle through: system → light → dark → system
  const cycleTheme = () => {
    const order: ThemePreference[] = ["system", "light", "dark"];
    const currentIndex = order.indexOf(preference.value);
    const nextIndex = (currentIndex + 1) % order.length;
    setTheme(order[nextIndex]);
  };

  // Initialize on client (called automatically when composable is used)
  const initTheme = () => {
    if (!import.meta.client) return;

    // Detect system preference
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    systemPreference.value = mediaQuery.matches ? "dark" : "light";

    // Load saved preference from localStorage
    const saved = localStorage.getItem(STORAGE_KEY) as ThemePreference | null;
    if (saved && ["light", "dark", "system"].includes(saved)) {
      preference.value = saved;
    }

    // Apply theme class immediately
    applyThemeClass();

    // Watch for system preference changes
    mediaQuery.addEventListener("change", (e) => {
      systemPreference.value = e.matches ? "dark" : "light";
      if (preference.value === "system") {
        applyThemeClass();
      }
    });
  };

  // Auto-initialize on client side
  if (import.meta.client) {
    // Initialize immediately
    initTheme();

    // Re-apply on next tick to ensure hydration is complete
    nextTick(() => {
      applyThemeClass();
    });

    // Watch for preference changes (from other components)
    watch(preference, () => {
      applyThemeClass();
    });

    // Watch for resolved theme changes
    watch(resolvedTheme, () => {
      applyThemeClass();
    });

    // Also watch for route changes to ensure theme persists across navigation
    const route = useRoute();
    watch(() => route.fullPath, () => {
      nextTick(() => {
        applyThemeClass();
      });
    });
  }

  return {
    /** User's chosen preference: 'light' | 'dark' | 'system' */
    preference: readonly(preference),
    /** What's actually showing: 'light' | 'dark' */
    resolvedTheme,
    /** Convenience boolean: true if dark mode is active */
    isDark,
    /** Set theme preference */
    setTheme,
    /** Toggle between light and dark */
    toggleTheme,
    /** Cycle through system → light → dark → system */
    cycleTheme,
    /** Manual initialization (usually not needed) */
    initTheme,
  };
};
