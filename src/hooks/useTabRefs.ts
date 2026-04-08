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
  | 'users' | 'features' | 'clients' | 'engagement' | 'technology'
  | 'geography' | 'events' | 'insights'
  | 'import' | 'product-jira-projects'
  | 'properties-api' | 'dm-campaign'
  | 'ai-task-board' | 'bugs-di-board';

export function useTabRefs() {
  const refs: Record<TabRefKey, React.RefObject<TabHandle | null>> = {
    'users': useRef<TabHandle>(null),
    'features': useRef<TabHandle>(null),
    'clients': useRef<TabHandle>(null),
    'engagement': useRef<TabHandle>(null),
    'technology': useRef<TabHandle>(null),
    'geography': useRef<TabHandle>(null),
    'events': useRef<TabHandle>(null),
    'insights': useRef<TabHandle>(null),
    'import': useRef<TabHandle>(null),
    'product-jira-projects': useRef<TabHandle>(null),
    'properties-api': useRef<TabHandle>(null),
    'dm-campaign': useRef<TabHandle>(null),
    'ai-task-board': useRef<TabHandle>(null),
    'bugs-di-board': useRef<TabHandle>(null),
  };

  /**
   * Resolve which ref key to use based on current navigation state.
   */
  const resolveRefKey = useCallback((
    mainSection: string,
    subsection: string,
    detailTab: string
  ): TabRefKey | null => {
    // Feedback Loop > Import tab
    if (mainSection === 'feedback-loop' && subsection === 'import') {
      return 'import';
    }
    // Features > 8020REI detail tabs
    if (mainSection === 'features' && subsection === 'features-rei') {
      if (detailTab === 'properties-api') return 'properties-api';
      if (detailTab === 'dm-campaign') return 'dm-campaign';
      return null;
    }
    // Product Tasks subsections
    if (mainSection === 'product-tasks') {
      if (subsection === 'ai-task-board') return 'ai-task-board';
      if (subsection === 'bugs-di-board') return 'bugs-di-board';
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
