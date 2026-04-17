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

import { useMemo, useState } from 'react';
import { AxisTable, AxisTooltip, AxisInput, AxisButton } from '@/components/axis';
import type { Column } from '@/types/table';
import type { DomainLeaderboardEntry } from '@/types/product';

type RiskFilter = 'all' | DomainLeaderboardEntry['risk_level'];

/** Tooltip explanations for each risk state */
const RISK_TOOLTIPS: Record<DomainLeaderboardEntry['risk_level'], { title: string; content: string }> = {
  healthy: {
    title: 'Healthy',
    content:
      'This domain had activity in the last 15 days. It is actively uploading properties and generating engagement. This status is independent of the time filter applied to the table.',
  },
  'at-risk': {
    title: 'At Risk',
    content:
      'This domain had activity between 16 and 90 days ago. It has gone quiet recently and may need attention before it becomes fully inactive. This status is independent of the time filter applied to the table.',
  },
  inactive: {
    title: 'Inactive',
    content:
      'This domain has had no recorded activity in the last 90+ days. Consider a re-activation outreach or review the domain status. This status is independent of the time filter applied to the table.',
  },
};

const CRM_INTEGRATED_VALUES = new Set(['Integrated 2-way', 'CRM → 8020REI']);

interface DomainLeaderboardWidgetProps {
  data: DomainLeaderboardEntry[];
  crmOnly?: boolean;
  onCrmToggle?: () => void;
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
function RiskBadge({
  level,
  active = true,
  onClick,
}: {
  level: DomainLeaderboardEntry['risk_level'];
  active?: boolean;
  onClick?: () => void;
}) {
  const config = RISK_CONFIG[level];
  const label = level === 'at-risk' ? 'At Risk' : level.charAt(0).toUpperCase() + level.slice(1);

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border transition-opacity ${config.bg} ${config.text} ${config.border} ${
        onClick ? 'cursor-pointer' : ''
      } ${active ? 'opacity-100' : 'opacity-40'}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {label}
    </span>
  );
}

export function DomainLeaderboardWidget({ data, crmOnly = false, onCrmToggle }: DomainLeaderboardWidgetProps) {
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Toggle filter: clicking the active filter resets to 'all'
  const handleFilterClick = (level: DomainLeaderboardEntry['risk_level']) => {
    setRiskFilter((prev) => (prev === level ? 'all' : level));
  };

  // Filtered data based on search query, risk level, and CRM toggle (all applied)
  const filteredData = useMemo(() => {
    let result = data;
    if (crmOnly) {
      result = result.filter((d) => CRM_INTEGRATED_VALUES.has(d.crm_integration ?? ''));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((d) => d.domain_name.toLowerCase().includes(q));
    }
    if (riskFilter !== 'all') {
      result = result.filter((d) => d.risk_level === riskFilter);
    }
    return result;
  }, [data, crmOnly, riskFilter, searchQuery]);

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
        field: 'risk_level',
        header: 'Risk',
        type: 'text',
        width: 120,
        sortable: true,
        render: (value) => (
          <RiskBadge level={value as DomainLeaderboardEntry['risk_level']} />
        ),
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
    <div className="h-full flex flex-col gap-3">
      {/* Search input */}
      <AxisInput
        type="search"
        placeholder="Search domains..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        size="sm"
        fullWidth
      />

      {/* CRM toggle + Risk filter legend + result count */}
      <div className="flex items-center gap-3 px-1">
        {onCrmToggle && (
          <button
            onClick={onCrmToggle}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
              crmOnly
                ? 'bg-main-100 dark:bg-main-900/30 text-main-700 dark:text-main-400 border-main-300 dark:border-main-700'
                : 'bg-surface-base text-content-secondary border-border-subtle hover:border-border-default'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${crmOnly ? 'bg-main-500' : 'bg-content-tertiary'}`} />
            CRM integrated
          </button>
        )}
        <span className="text-xs text-content-tertiary">Risk:</span>
        {(['healthy', 'at-risk', 'inactive'] as const).map((level) => (
          <AxisTooltip
            key={level}
            title={RISK_TOOLTIPS[level].title}
            content={RISK_TOOLTIPS[level].content}
            placement="top"
            maxWidth={260}
          >
            <RiskBadge
              level={level}
              active={riskFilter === 'all' || riskFilter === level}
              onClick={() => handleFilterClick(level)}
            />
          </AxisTooltip>
        ))}
        {riskFilter !== 'all' && (
          <AxisButton
            size="sm"
            variant="ghost"
            onClick={() => setRiskFilter('all')}
          >
            Clear
          </AxisButton>
        )}
        {(searchQuery.trim() || riskFilter !== 'all') && (
          <span className="ml-auto text-xs text-content-tertiary">
            {filteredData.length} of {data.length} domains
          </span>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0">
        <AxisTable
          columns={columns}
          data={filteredData as unknown as Record<string, unknown>[]}
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
