/**
 * Custom hook for managing tab component refs.
 *
 * Centralizes the imperative ref orchestration (resetLayout, openWidgetCatalog)
 * so that page.tsx doesn't need a manual switch/case block per tab.
 */

import { useRef, useCallback } from 'react';
import { TabHandle } from '@/types/widget';

/** Maps a navigation key to a ref. The key is derived from the tab's position in the nav hierarchy. */
type TabRefKey =
  | 'users' | 'features' | 'clients' | 'traffic' | 'technology'
  | 'geography' | 'events' | 'insights'
  | 'client-domains' | 'product-jira-projects'
  | 'properties-api';

export function useTabRefs() {
  const refs: Record<TabRefKey, React.RefObject<TabHandle | null>> = {
    'users': useRef<TabHandle>(null),
    'features': useRef<TabHandle>(null),
    'clients': useRef<TabHandle>(null),
    'traffic': useRef<TabHandle>(null),
    'technology': useRef<TabHandle>(null),
    'geography': useRef<TabHandle>(null),
    'events': useRef<TabHandle>(null),
    'insights': useRef<TabHandle>(null),
    'client-domains': useRef<TabHandle>(null),
    'product-jira-projects': useRef<TabHandle>(null),
    'properties-api': useRef<TabHandle>(null),
  };

  /**
   * Resolve which ref key to use based on current navigation state.
   */
  const resolveRefKey = useCallback((
    mainSection: string,
    subsection: string,
    detailTab: string
  ): TabRefKey | null => {
    // Product section tabs
    if (mainSection === 'product') {
      if (subsection === 'client-domains' || subsection === 'product-jira-projects') {
        return subsection as TabRefKey;
      }
      return null;
    }
    // Features > 8020REI detail tabs
    if (mainSection === 'features' && subsection === 'features-rei') {
      if (detailTab === 'properties-api') return 'properties-api';
      return null;
    }
    // GA4 detail tabs
    if (detailTab && detailTab !== 'overview' && detailTab in refs) {
      return detailTab as TabRefKey;
    }
    return null;
  }, []);

  const resetLayout = useCallback((
    mainSection: string,
    subsection: string,
    detailTab: string
  ) => {
    const key = resolveRefKey(mainSection, subsection, detailTab);
    if (key) {
      refs[key].current?.resetLayout();
    }
  }, [resolveRefKey]);

  const openWidgetCatalog = useCallback((
    mainSection: string,
    subsection: string,
    detailTab: string
  ) => {
    const key = resolveRefKey(mainSection, subsection, detailTab);
    if (key) {
      refs[key].current?.openWidgetCatalog();
    }
  }, [resolveRefKey]);

  return { refs, resetLayout, openWidgetCatalog, resolveRefKey };
}
