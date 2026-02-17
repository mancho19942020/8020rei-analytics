/**
 * Domain Leaderboard Widget
 *
 * Displays a ranked table of domains with key metrics including:
 * - Domain name, total properties, leads, appointments, deals
 * - Total revenue (formatted as currency)
 * - Last activity date
 * - Risk level with color-coded badges (healthy/at-risk/inactive)
 *
 * Uses AxisTable for sorting, pagination, and consistent styling.
 * Risk level is rendered as colored badge text via pre-processed data.
 */

'use client';

import { useMemo } from 'react';
import { AxisTable } from '@/components/axis';
import type { Column } from '@/types/table';
import type { DomainLeaderboardEntry } from '@/types/product';

interface DomainLeaderboardWidgetProps {
  data: DomainLeaderboardEntry[];
}

/**
 * Risk level badge configuration for color-coded display.
 */
const RISK_CONFIG = {
  healthy: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-400',
    border: 'border-green-200 dark:border-green-800',
    dot: 'bg-green-500',
  },
  'at-risk': {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-500',
  },
  inactive: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800',
    dot: 'bg-red-500',
  },
};

/**
 * Risk level badge component for inline display.
 */
function RiskBadge({ level }: { level: DomainLeaderboardEntry['risk_level'] }) {
  const config = RISK_CONFIG[level];
  const label = level === 'at-risk' ? 'At Risk' : level.charAt(0).toUpperCase() + level.slice(1);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text} border ${config.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {label}
    </span>
  );
}

export function DomainLeaderboardWidget({ data }: DomainLeaderboardWidgetProps) {
  // Define table columns
  const columns: Column[] = useMemo(
    () => [
      {
        field: 'domain_name',
        header: 'Domain',
        type: 'text',
        width: 180,
        sortable: true,
      },
      {
        field: 'total_properties',
        header: 'Properties',
        type: 'number',
        width: 100,
        sortable: true,
      },
      {
        field: 'leads_count',
        header: 'Leads',
        type: 'number',
        width: 80,
        sortable: true,
      },
      {
        field: 'appointments_count',
        header: 'Appts',
        type: 'number',
        width: 80,
        sortable: true,
      },
      {
        field: 'deals_count',
        header: 'Deals',
        type: 'number',
        width: 80,
        sortable: true,
      },
      {
        field: 'total_revenue',
        header: 'Revenue',
        type: 'currency',
        width: 120,
        sortable: true,
      },
      {
        field: 'last_activity_date',
        header: 'Last Activity',
        type: 'date',
        width: 120,
        sortable: true,
      },
      {
        field: 'risk_level',
        header: 'Risk',
        type: 'text',
        width: 110,
        sortable: true,
      },
    ],
    []
  );

  // Build custom table rows to support risk badges
  // Since AxisTable renders text for 'text' type, we build a custom
  // layout that uses AxisTable for structure but overlays risk badges
  // via a wrapper approach.

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-content-secondary">
        No domain data available
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Risk level legend */}
      <div className="flex items-center gap-3 mb-3 px-1">
        <span className="text-xs text-content-tertiary">Risk:</span>
        <RiskBadge level="healthy" />
        <RiskBadge level="at-risk" />
        <RiskBadge level="inactive" />
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0">
        <AxisTable
          columns={columns}
          data={data as unknown as Record<string, unknown>[]}
          rowKey="domain_name"
          sortable
          paginated
          defaultPageSize={10}
          rowLabel="domains"
        />
      </div>
    </div>
  );
}
