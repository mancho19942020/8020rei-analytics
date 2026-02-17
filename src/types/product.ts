/**
 * Product Tab Type Definitions
 *
 * Types for the Product subsection under Analytics:
 * - Client Domains: domain upload tracking from feedback_clients_unique
 * - Product Projects: Jira project tracking from issues tables
 */

// ============================================================================
// SHARED
// ============================================================================

export interface TrendData {
  value: number;
  isPositive: boolean;
}

// ============================================================================
// CLIENT DOMAINS
// ============================================================================

export interface DomainActivityOverview {
  total_active_domains: number;
  total_properties: number;
  leads_count: number;
  appointments_count: number;
  deals_count: number;
  total_revenue: number;
  trends?: {
    total_active_domains: TrendData;
    total_properties: TrendData;
    leads_count: TrendData;
    total_revenue: TrendData;
  };
}

export interface DomainLeaderboardEntry {
  domain_name: string;
  total_properties: number;
  leads_count: number;
  appointments_count: number;
  deals_count: number;
  total_revenue: number;
  last_activity_date: string;
  days_since_activity: number;
  risk_level: 'healthy' | 'at-risk' | 'inactive';
}

export interface DomainActivityTrendEntry {
  date: string;
  properties_uploaded: number;
  domain_count: number;
}

export interface RevenueByDomainEntry {
  domain_name: string;
  revenue: number;
}

export interface FlaggedDomainEntry {
  domain_id: number;
  domain_name: string;
  flag: string;
  flag_info: string;
  date: string;
}

export interface ClientDomainsData {
  overview: DomainActivityOverview;
  leaderboard: DomainLeaderboardEntry[];
  activityTrend: DomainActivityTrendEntry[];
  revenueByDomain: RevenueByDomainEntry[];
  flaggedDomains: FlaggedDomainEntry[];
}

// ============================================================================
// PRODUCT PROJECTS (Jira)
// ============================================================================

export interface ProjectStatusOverview {
  active_projects: number;
  on_track: number;
  delayed: number;
  completed: number;
  trends?: {
    active_projects: TrendData;
    completed: TrendData;
  };
}

export interface ProjectEntry {
  issue_key: string;
  summary: string;
  status: string;
  assignee: string;
  due_date: string;
  story_points_completed: number;
  story_points_total: number;
  days_of_delay: number;
}

export interface BugEntry {
  origin: string;
  count: number;
}

export interface WeeklyBugTrend {
  week: string;
  count: number;
}

export interface BugTrackingData {
  total_unique_bugs: number;
  customer_bugs: number;
  critical_bugs: number;
  critical_open_bugs: number;
  bug_origins: BugEntry[];
  weekly_trend: WeeklyBugTrend[];
  trends?: {
    total_unique_bugs: TrendData;
    customer_bugs: TrendData;
  };
}

export interface TeamWorkloadEntry {
  assignee: string;
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  delayed_tasks: number;
}

export interface DeliveryTimelineEntry {
  issue_key: string;
  summary: string;
  due_date: string;
  resolved_date: string | null;
  days_of_delay: number;
}

export interface ProductProjectsData {
  overview: ProjectStatusOverview;
  projects: ProjectEntry[];
  bugTracking: BugTrackingData;
  teamWorkload: TeamWorkloadEntry[];
  deliveryTimeline: DeliveryTimelineEntry[];
}
