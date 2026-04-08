/**
 * Navigation Structure Configuration
 *
 * Defines the 3-level navigation hierarchy for the dashboard:
 * Level 1: Main Sections (Product, Analytics, Feedback Loop, etc.)
 * Level 2: Sub-sections within each main section
 * Level 3: Detail tabs (Overview, Users, Features, etc.)
 */

import { AxisNavigationTabItem } from '@/components/axis';

// First-level navigation - Main Sections
export const MAIN_SECTION_TABS: AxisNavigationTabItem[] = [
  { id: 'analytics', name: 'Analytics' },
  { id: 'features', name: 'Features' },
  { id: 'feedback-loop', name: 'Feedback Loop' },
  { id: 'engagement-calls', name: 'Engagement Calls' },
  { id: 'product-tasks', name: 'Product Tasks' },
  { id: 'customer-success', name: 'Customer Success', disabled: true },
  { id: 'qa', name: 'QA', disabled: true },
  { id: 'pipelines', name: 'Pipelines', disabled: true },
  { id: 'ml-models', name: 'ML Models', disabled: true },
  { id: 'grafana', name: 'Grafana (beta)' },
];

// Second-level navigation - Sub-sections per Main Section

const ANALYTICS_SUBSECTION_TABS: AxisNavigationTabItem[] = [
  { id: '8020rei-ga4', name: '8020REI GA4' },
  { id: '8020roofing-ga4', name: '8020Roofing GA4', disabled: true },
];

const FEEDBACK_LOOP_SUBSECTION_TABS: AxisNavigationTabItem[] = [
  { id: 'import', name: 'Import' },
  { id: 'salesforce', name: 'Salesforce', disabled: true },
  { id: 'integrations', name: 'Integrations', disabled: true },
  { id: 'leads-funnel', name: 'Leads Funnel', disabled: true },
  { id: 'delivery-audit', name: 'Delivery Audit', disabled: true },
];

const FEATURES_SUBSECTION_TABS: AxisNavigationTabItem[] = [
  { id: 'features-rei', name: '8020REI' },
  { id: 'features-roofing', name: '8020Roofing', disabled: true },
];

const PIPELINES_SUBSECTION_TABS: AxisNavigationTabItem[] = [
  { id: 'pipelines-rei', name: '8020REI', disabled: true },
  { id: 'pipelines-roofing', name: '8020Roofing', disabled: true },
];

const QA_SUBSECTION_TABS: AxisNavigationTabItem[] = [
  { id: 'axiom-validation', name: 'Axiom Validation', disabled: true },
  { id: 'buybox-columns', name: 'BuyBox Columns', disabled: true },
  { id: 'smoke-sanity', name: 'Smoke & Sanity', disabled: true },
  { id: 'marketing-counter-reliability', name: 'Marketing Counter Reliability', disabled: true },
];

const ML_MODELS_SUBSECTION_TABS: AxisNavigationTabItem[] = [
  { id: 'deal-scoring', name: 'Deal Scoring', disabled: true },
  { id: 'model-performance', name: 'Model Performance', disabled: true },
  { id: 'drift-detection', name: 'Drift Detection', disabled: true },
];

const PRODUCT_TASKS_SUBSECTION_TABS: AxisNavigationTabItem[] = [
  { id: 'ai-task-board', name: 'AI task board' },
  { id: 'bugs-di-board', name: 'Bugs & DI board' },
];

export const SUBSECTION_TABS_MAP: Record<string, AxisNavigationTabItem[]> = {
  // 'customer-success' has no subsections — renders Under Construction directly
  'analytics': ANALYTICS_SUBSECTION_TABS,
  'feedback-loop': FEEDBACK_LOOP_SUBSECTION_TABS,
  'features': FEATURES_SUBSECTION_TABS,
  'product-tasks': PRODUCT_TASKS_SUBSECTION_TABS,
  'pipelines': PIPELINES_SUBSECTION_TABS,
  'qa': QA_SUBSECTION_TABS,
  'ml-models': ML_MODELS_SUBSECTION_TABS,
};

// Third-level navigation - Detail tabs

export const GA4_DETAIL_TABS: AxisNavigationTabItem[] = [
  { id: 'overview', name: 'Overview' },
  { id: 'users', name: 'Users' },
  { id: 'features', name: 'Features' },
  { id: 'clients', name: 'Clients' },
  { id: 'engagement', name: 'Engagement' },
  { id: 'technology', name: 'Technology' },
  { id: 'geography', name: 'Geography' },
  { id: 'events', name: 'Events' },
  { id: 'insights', name: 'Insights' },
];

export const DM_CAMPAIGN_SUB_TABS: AxisNavigationTabItem[] = [
  { id: 'operational-health', name: 'Operational health' },
  { id: 'business-results', name: 'Business results' },
];

export const FEATURES_REI_DETAIL_TABS: AxisNavigationTabItem[] = [
  { id: 'dm-campaign', name: 'DM Campaign' },
  { id: 'properties-api', name: 'Properties API' },
  { id: 'skiptrace', name: 'Skip Trace', disabled: true },
  { id: 'auto-export', name: 'Auto Export', disabled: true },
  { id: 'zillow', name: 'Zillow', disabled: true },
  { id: 'roi', name: 'ROI', disabled: true },
  { id: 'buyers-list', name: 'Buyers List', disabled: true },
];

export const FEATURES_ROOFING_DETAIL_TABS: AxisNavigationTabItem[] = [
  { id: 'zillow', name: 'Zillow', disabled: true },
  { id: 'upcoming-features', name: 'Upcoming Features', disabled: true },
];

export const PIPELINES_REI_DETAIL_TABS: AxisNavigationTabItem[] = [
  { id: 'eda-etl', name: 'EDA ETL', disabled: true },
  { id: 'etl-rei', name: 'ETL REI', disabled: true },
];

export const PIPELINES_ROOFING_DETAIL_TABS: AxisNavigationTabItem[] = [
  { id: 'etl-roofing', name: 'ETL Roofing', disabled: true },
];

/**
 * Get detail tabs for a given main section + subsection combination.
 * Returns null if the combination doesn't have detail tabs.
 */
export function getDetailTabsForSubsection(section: string, sub: string): AxisNavigationTabItem[] | null {
  if (section === 'analytics' && (sub === '8020rei-ga4' || sub === '8020roofing-ga4')) return GA4_DETAIL_TABS;
  if (section === 'features' && sub === 'features-rei') return FEATURES_REI_DETAIL_TABS;
  if (section === 'features' && sub === 'features-roofing') return FEATURES_ROOFING_DETAIL_TABS;
  if (section === 'pipelines' && sub === 'pipelines-rei') return PIPELINES_REI_DETAIL_TABS;
  if (section === 'pipelines' && sub === 'pipelines-roofing') return PIPELINES_ROOFING_DETAIL_TABS;
  return null;
}

/**
 * Get the default detail tab when switching to a subsection.
 */
export function getDefaultDetailTab(sub: string): string | undefined {
  if (sub === '8020rei-ga4' || sub === '8020roofing-ga4') return 'overview';
  if (sub === 'features-rei') return 'properties-api';
  if (sub === 'features-roofing') return 'upcoming-features';
  if (sub === 'pipelines-rei') return 'eda-etl';
  if (sub === 'pipelines-roofing') return 'etl-roofing';
  return undefined;
}

/**
 * Build a clean URL path from navigation state.
 * Examples:
 *   buildNavUrl('analytics', '8020rei-ga4', 'overview')                     → '/analytics/8020rei-ga4/overview'
 *   buildNavUrl('engagement-calls', '', '')                                  → '/engagement-calls'
 *   buildNavUrl('feedback-loop', 'import', '')                              → '/feedback-loop/import'
 *   buildNavUrl('features', 'features-rei', 'dm-campaign', 'business-results') → '/features/features-rei/dm-campaign/business-results'
 */
export function buildNavUrl(section: string, sub?: string, tab?: string, subTab?: string): string {
  let path = `/${section}`;
  if (sub) {
    path += `/${sub}`;
    if (tab) {
      path += `/${tab}`;
      if (subTab) {
        path += `/${subTab}`;
      }
    }
  }
  return path;
}

/**
 * Parse URL slug segments into navigation state.
 * Validates each level against the navigation config and falls back to defaults.
 * Supports 4th segment for sub-tabs (e.g., /features/features-rei/dm-campaign/business-results).
 */
export function parseNavFromSlug(slug: string[]): { section: string; sub: string; tab: string; subTab: string } {
  const [rawSection, rawSub, rawTab, rawSubTab] = slug;

  // Validate section
  const validSection = MAIN_SECTION_TABS.find(t => t.id === rawSection)
    ? rawSection
    : 'analytics';

  // Resolve subsection
  const subsections = SUBSECTION_TABS_MAP[validSection];
  let validSub = '';
  if (subsections && subsections.length > 0) {
    const matchedSub = rawSub ? subsections.find(t => t.id === rawSub && !t.disabled) : null;
    validSub = matchedSub ? matchedSub.id : (subsections.find(s => !s.disabled)?.id || subsections[0].id);
  }

  // Resolve detail tab
  let validTab = '';
  const detailTabs = getDetailTabsForSubsection(validSection, validSub);
  if (detailTabs) {
    const matchedTab = rawTab ? detailTabs.find(t => t.id === rawTab && !t.disabled) : null;
    validTab = matchedTab ? matchedTab.id : (detailTabs.find(t => !t.disabled)?.id || detailTabs[0].id);
  }

  // Resolve sub-tab (4th level — currently only used by dm-campaign)
  let validSubTab = '';
  if (validTab === 'dm-campaign') {
    const matched = rawSubTab ? DM_CAMPAIGN_SUB_TABS.find(t => t.id === rawSubTab) : null;
    validSubTab = matched ? matched.id : 'operational-health';
  }

  return { section: validSection, sub: validSub, tab: validTab, subTab: validSubTab };
}
