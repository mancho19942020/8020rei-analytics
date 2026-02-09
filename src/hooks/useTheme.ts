/**
 * Theme Management Hook (React version)
 *
 * Provides theme state management with:
 * - System preference detection
 * - localStorage persistence
 * - SSR-safe implementation
 * - No flash of wrong theme (FOUC prevention)
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
 * if (isDark) { ... }
 */

'use client';

import { useEffect, useState, useCallback } from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'theme-preference';

export function useTheme() {
  // User's preference (what they chose)
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  // System preference (detected from OS)
  const [systemPreference, setSystemPreference] = useState<ResolvedTheme>('light');

  // Track if mounted (for SSR safety)
  const [isMounted, setIsMounted] = useState(false);

  // Resolved theme (what's actually showing)
  const resolvedTheme: ResolvedTheme = preference === 'system' ? systemPreference : preference;

  // Convenience boolean
  const isDark = resolvedTheme === 'dark';

  // Apply the .dark class to <html>
  const applyThemeClass = useCallback((theme: ResolvedTheme) => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    const shouldBeDark = theme === 'dark';

    root.classList.toggle('dark', shouldBeDark);

    // Update meta theme-color for mobile browsers
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute('content', shouldBeDark ? '#111827' : '#ffffff');
  }, []);

  // Set theme preference
  const setTheme = useCallback((theme: ThemePreference) => {
    setPreferenceState(theme);

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, theme);
    }
  }, []);

  // Toggle between light and dark (ignores system)
  const toggleTheme = useCallback(() => {
    setTheme(isDark ? 'light' : 'dark');
  }, [isDark, setTheme]);

  // Cycle through: system → light → dark → system
  const cycleTheme = useCallback(() => {
    const order: ThemePreference[] = ['system', 'light', 'dark'];
    const currentIndex = order.indexOf(preference);
    const nextIndex = (currentIndex + 1) % order.length;
    setTheme(order[nextIndex]);
  }, [preference, setTheme]);

  // Initialize on client
  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsMounted(true);

    // Detect system preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemPreference(mediaQuery.matches ? 'dark' : 'light');

    // Load saved preference from localStorage
    const saved = localStorage.getItem(STORAGE_KEY) as ThemePreference | null;
    if (saved && ['light', 'dark', 'system'].includes(saved)) {
      setPreferenceState(saved);
    }

    // Watch for system preference changes
    const handler = (e: MediaQueryListEvent) => {
      setSystemPreference(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Apply theme class whenever resolved theme changes
  useEffect(() => {
    if (isMounted) {
      applyThemeClass(resolvedTheme);
    }
  }, [resolvedTheme, isMounted, applyThemeClass]);

  return {
    /** User's chosen preference: 'light' | 'dark' | 'system' */
    preference,
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
    /** Whether the hook has mounted (for SSR safety) */
    isMounted,
  };
}
