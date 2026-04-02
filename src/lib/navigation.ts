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
  { id: 'customer-success', name: 'Customer Success' },
  { id: 'analytics', name: 'Analytics' },
  { id: 'feedback-loop', name: 'Feedback Loop' },
  { id: 'features', name: 'Features' },
  { id: 'pipelines', name: 'Pipelines' },
  { id: 'qa', name: 'QA' },
  { id: 'ml-models', name: 'ML Models' },
  { id: 'engagement-calls', name: 'Engagement Calls' },
  { id: 'grafana', name: 'Grafana' },
];

// Second-level navigation - Sub-sections per Main Section

const ANALYTICS_SUBSECTION_TABS: AxisNavigationTabItem[] = [
  { id: '8020rei-ga4', name: '8020REI GA4' },
  { id: '8020roofing-ga4', name: '8020Roofing GA4', disabled: true },
];

const FEEDBACK_LOOP_SUBSECTION_TABS: AxisNavigationTabItem[] = [
  { id: 'import', name: 'Import' },
  { id: 'salesforce', name: 'Salesforce' },
  { id: 'integrations', name: 'Integrations' },
  { id: 'leads-funnel', name: 'Leads Funnel' },
  { id: 'delivery-audit', name: 'Delivery Audit' },
];

const FEATURES_SUBSECTION_TABS: AxisNavigationTabItem[] = [
  { id: 'features-rei', name: '8020REI' },
  { id: 'features-roofing', name: '8020Roofing' },
];

const PIPELINES_SUBSECTION_TABS: AxisNavigationTabItem[] = [
  { id: 'pipelines-rei', name: '8020REI' },
  { id: 'pipelines-roofing', name: '8020Roofing' },
];

const QA_SUBSECTION_TABS: AxisNavigationTabItem[] = [
  { id: 'axiom-validation', name: 'Axiom Validation' },
  { id: 'buybox-columns', name: 'BuyBox Columns' },
  { id: 'smoke-sanity', name: 'Smoke & Sanity' },
  { id: 'marketing-counter-reliability', name: 'Marketing Counter Reliability' },
];

const ML_MODELS_SUBSECTION_TABS: AxisNavigationTabItem[] = [
  { id: 'deal-scoring', name: 'Deal Scoring' },
  { id: 'model-performance', name: 'Model Performance' },
  { id: 'drift-detection', name: 'Drift Detection' },
];

export const SUBSECTION_TABS_MAP: Record<string, AxisNavigationTabItem[]> = {
  // 'customer-success' has no subsections — renders Under Construction directly
  'analytics': ANALYTICS_SUBSECTION_TABS,
  'feedback-loop': FEEDBACK_LOOP_SUBSECTION_TABS,
  'features': FEATURES_SUBSECTION_TABS,
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
  { id: 'traffic', name: 'Traffic' },
  { id: 'technology', name: 'Technology' },
  { id: 'geography', name: 'Geography' },
  { id: 'events', name: 'Events' },
  { id: 'insights', name: 'Insights' },
];

export const FEATURES_REI_DETAIL_TABS: AxisNavigationTabItem[] = [
  { id: 'rapid-response', name: 'DM Campaign' },
  { id: 'properties-api', name: 'Properties API' },
  { id: 'skiptrace', name: 'Skip Trace' },
  { id: 'auto-export', name: 'Auto Export' },
  { id: 'zillow', name: 'Zillow' },
  { id: 'roi', name: 'ROI' },
  { id: 'buyers-list', name: 'Buyers List' },
];

export const FEATURES_ROOFING_DETAIL_TABS: AxisNavigationTabItem[] = [
  { id: 'zillow', name: 'Zillow' },
  { id: 'upcoming-features', name: 'Upcoming Features' },
];

export const PIPELINES_REI_DETAIL_TABS: AxisNavigationTabItem[] = [
  { id: 'eda-etl', name: 'EDA ETL' },
  { id: 'etl-rei', name: 'ETL REI' },
];

export const PIPELINES_ROOFING_DETAIL_TABS: AxisNavigationTabItem[] = [
  { id: 'etl-roofing', name: 'ETL Roofing' },
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
 *   buildNavUrl('analytics', '8020rei-ga4', 'overview') → '/analytics/8020rei-ga4/overview'
 *   buildNavUrl('engagement-calls', '', '')              → '/engagement-calls'
 *   buildNavUrl('feedback-loop', 'import', '')           → '/feedback-loop/import'
 */
export function buildNavUrl(section: string, sub?: string, tab?: string): string {
  let path = `/${section}`;
  if (sub) {
    path += `/${sub}`;
    if (tab) {
      path += `/${tab}`;
    }
  }
  return path;
}

/**
 * Parse URL slug segments into navigation state.
 * Validates each level against the navigation config and falls back to defaults.
 */
export function parseNavFromSlug(slug: string[]): { section: string; sub: string; tab: string } {
  const [rawSection, rawSub, rawTab] = slug;

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

  return { section: validSection, sub: validSub, tab: validTab };
}
