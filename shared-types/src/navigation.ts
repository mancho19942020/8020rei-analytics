/**
 * Navigation Types
 *
 * Types for the 3-level navigation system.
 * Defines the structure of main sections, sub-sections, and detail tabs.
 */

// ============================================================================
// NAVIGATION STRUCTURE
// ============================================================================

/**
 * Main section identifiers (Level 1)
 */
export type MainSection =
  | 'analytics'
  | 'salesforce'
  | 'data-silos'
  | 'tools'
  | 'pipelines'
  | 'qa'
  | 'ml-models';

/**
 * Analytics sub-section identifiers (Level 2)
 */
export type AnalyticsSubsection = '8020rei-ga4' | '8020roofing-ga4';

/**
 * Salesforce sub-section identifiers (Level 2)
 */
export type SalesforceSubsection =
  | 'integrations'
  | 'leads-funnel'
  | 'delivery-audit'
  | 'feedback-loop';

/**
 * Data Silos sub-section identifiers (Level 2)
 */
export type DataSilosSubsection = 'silo-scraping' | 'zillow';

/**
 * Tools sub-section identifiers (Level 2)
 */
export type ToolsSubsection = 'skiptrace' | 'rapid-response' | 'smart-drop';

/**
 * Pipelines sub-section identifiers (Level 2)
 */
export type PipelinesSubsection =
  | 'pipeline-overview'
  | 'bronze-silver-gold'
  | 'buyers-list';

/**
 * QA sub-section identifiers (Level 2)
 */
export type QaSubsection = 'axiom-validation' | 'buybox-columns' | 'smoke-sanity';

/**
 * ML Models sub-section identifiers (Level 2)
 */
export type MlModelsSubsection =
  | 'deal-scoring'
  | 'model-performance'
  | 'drift-detection';

/**
 * All sub-section types combined
 */
export type Subsection =
  | AnalyticsSubsection
  | SalesforceSubsection
  | DataSilosSubsection
  | ToolsSubsection
  | PipelinesSubsection
  | QaSubsection
  | MlModelsSubsection;

/**
 * GA4 detail tab identifiers (Level 3)
 */
export type Ga4DetailTab =
  | 'overview'
  | 'users'
  | 'features'
  | 'clients'
  | 'traffic'
  | 'technology'
  | 'geography'
  | 'events'
  | 'insights';

// ============================================================================
// NAVIGATION ITEM TYPES
// ============================================================================

/**
 * Navigation tab item
 */
export interface NavigationTabItem {
  id: string;
  name: string;
  icon?: string; // Icon component key
  disabled?: boolean;
  badge?: number | string;
  href?: string;
}

/**
 * Navigation configuration
 */
export interface NavigationConfig {
  mainSections: NavigationTabItem[];
  subsections: Record<MainSection, NavigationTabItem[]>;
  detailTabs: Record<string, NavigationTabItem[]>; // Key is subsection ID
}

// ============================================================================
// NAVIGATION STATE
// ============================================================================

/**
 * Current navigation state
 */
export interface NavigationState {
  activeMainSection: MainSection;
  activeSubsection: Subsection;
  activeDetailTab?: Ga4DetailTab;
}

/**
 * Navigation breadcrumb
 */
export interface NavigationBreadcrumb {
  label: string;
  path: string;
  level: 1 | 2 | 3;
}
