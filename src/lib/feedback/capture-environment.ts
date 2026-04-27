/**
 * Environment context capture — runs at submit time.
 *
 * Pulls from URL, DOM signals, and the small ring buffers maintained by
 * console-capture and navigation-breadcrumb.
 */

import type { FeedbackEnvironmentContext } from './types';
import { getRecentErrors } from './console-capture';
import { getNavigationPath } from './navigation-breadcrumb';

function captureUrlParams(): Record<string, string> {
  const out: Record<string, string> = {};
  if (typeof window === 'undefined') return out;
  new URLSearchParams(window.location.search).forEach((v, k) => {
    out[k] = v;
  });
  return out;
}

function detectPageState(): 'loading' | 'ready' | 'error' | 'partial' {
  if (typeof document === 'undefined') return 'ready';
  const main = document.querySelector('main') ?? document.body;

  if (
    main.querySelector(
      '[class*="error-alert"], [role="alert"][class*="destructive"], [data-state="error"]'
    )
  ) {
    return 'error';
  }

  const skeletons = main.querySelectorAll(
    '.animate-pulse, [class*="skeleton"], [data-state="loading"]'
  );
  // Project-specific signals that real content has rendered:
  //   AxisCard, KPI big-value, AxisTable, charts, canvases.
  const hasContent =
    main.querySelectorAll(
      [
        '.big-value',
        '.kpi-card',
        '.card-surface',
        '.stat-card',
        'table',
        'canvas',
        '[data-axis="card"]',
        '[data-axis="table"]',
      ].join(',')
    ).length > 0;
  if (skeletons.length > 0 && !hasContent) return 'loading';
  if (skeletons.length > 0 && hasContent) return 'partial';
  return 'ready';
}

/**
 * `loadedSources` is a hook for app-specific data layers. The metrics hub
 * doesn't have a single registry of loaded sources today, so this returns []
 * and serves as a future extension point. (See README.)
 */
function getLoadedDataSources(): string[] {
  return [];
}

export function captureEnvironmentContext(
  visibleValues: Record<string, string> = {}
): FeedbackEnvironmentContext {
  return {
    urlParams: captureUrlParams(),
    pageState: detectPageState(),
    loadedSources: getLoadedDataSources(),
    recentErrors: getRecentErrors(),
    navigationPath: getNavigationPath(),
    visibleValues,
  };
}
