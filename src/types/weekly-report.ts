/**
 * Weekly Report Types
 *
 * Executive summary report: weekly delivery & quality.
 * Covers deliverables, bugs, data inquiries, and suggestions.
 */

export interface WeeklyDeliverable {
  gid: string;
  name: string;
  assignee_name: string | null;
  business_impact: number | null;
  completed_at: string;
  feature_type: string | null;
}

export interface WeeklyBugStatus {
  reported_this_week: number;
  closed_this_week: number;
  open: number;
  customer_reported: number;
  internal_product: number;
}

export interface WeeklyCriticalBugs {
  reported_this_week: number;
  closed_this_week: number;
  open: number;
}

export interface WeeklyDataInquiries {
  reported_this_week: number;
  open: number;
}

export interface WeeklySuggestions {
  new_this_week: number;
  under_review: number;
  in_execution: number;
  in_backlog: number;
  delivered: number;
}

export interface WeeklyReportData {
  deliverables: WeeklyDeliverable[];
  bugs: WeeklyBugStatus;
  critical_bugs: WeeklyCriticalBugs;
  data_inquiries: WeeklyDataInquiries;
  suggestions: WeeklySuggestions;
  week_start: string;
  week_end: string;
}
