/**
 * Asana Tasks Type Definitions
 *
 * Types for the Product Tasks chapter:
 * - AI Task Board: feature/project task tracking with business impact
 * - Bugs & DI Board: bug and data inquiry tracking with resolution data
 */

import { TrendData } from './product';

// ============================================================================
// SHARED — used by both boards
// ============================================================================

export interface AsanaBoardOverview {
  total_tasks: number;
  in_progress: number;
  to_do: number;
  backlog: number;
  completed: number;
  overdue: number;
  unassigned: number;
  avg_business_impact: number | null;
  trends?: {
    total_tasks: TrendData;
    completed: TrendData;
    overdue: TrendData;
  };
}

export interface AsanaTeamWorkloadEntry {
  assignee_name: string;
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  overdue_tasks: number;
}

export interface AsanaSectionBreakdownEntry {
  section: string;
  count: number;
}

export interface AsanaWeeklyTrendEntry {
  week: string;
  created: number;
  completed: number;
}

export interface AsanaTaskAgingEntry {
  bucket: string;
  count: number;
}

export interface AsanaAlertItem {
  type: 'overdue' | 'unassigned' | 'stale' | 'overload';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  count?: number;
  permalink_url?: string;
}

// ============================================================================
// AI TASK BOARD
// ============================================================================

export interface AiTaskBoardEntry {
  gid: string;
  name: string;
  assignee_name: string | null;
  completed: boolean;
  section: string;
  due_on: string | null;
  start_on: string | null;
  created_at: string;
  modified_at: string;
  permalink_url: string;
  business_impact: number | null;
  feature_type: string | null;
  estimated_days: number | null;
  aita_id: string | null;
  priority: string | null;
  task_status: string | null;
  days_overdue: number | null;
}

export interface AiTaskBoardData {
  overview: AsanaBoardOverview;
  tasks: AiTaskBoardEntry[];
  teamWorkload: AsanaTeamWorkloadEntry[];
  sectionBreakdown: AsanaSectionBreakdownEntry[];
  weeklyTrend: AsanaWeeklyTrendEntry[];
  taskAging: AsanaTaskAgingEntry[];
}

// ============================================================================
// BUGS & DI BOARD
// ============================================================================

export interface BugsDiBoardEntry {
  gid: string;
  name: string;
  assignee_name: string | null;
  completed: boolean;
  section: string;
  due_on: string | null;
  created_at: string;
  modified_at: string;
  permalink_url: string;
  type: string | null;
  resolution: string | null;
  origin: string | null;
  reporter: string | null;
  module: string | null;
  bug_priority: string | null;
  user_mistake: string | null;
  is_recurrent: string | null;
  labels: string | null;
  days_overdue: number | null;
}

export interface BugsByTypeEntry {
  type: string;
  count: number;
}

export interface BugsByModuleEntry {
  module: string;
  count: number;
}

export interface BugsByOriginEntry {
  origin: string;
  count: number;
}

export interface BugsDiBoardData {
  overview: AsanaBoardOverview;
  tasks: BugsDiBoardEntry[];
  teamWorkload: AsanaTeamWorkloadEntry[];
  sectionBreakdown: AsanaSectionBreakdownEntry[];
  weeklyTrend: AsanaWeeklyTrendEntry[];
  taskAging: AsanaTaskAgingEntry[];
  bugsByType: BugsByTypeEntry[];
  bugsByModule: BugsByModuleEntry[];
  bugsByOrigin: BugsByOriginEntry[];
}
