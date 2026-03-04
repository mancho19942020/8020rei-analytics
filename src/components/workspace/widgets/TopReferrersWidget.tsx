/**
 * Top Referrers Widget
 *
 * Displays a table of top referrer domains categorized by type using AxisTable.
 * Categories: Internal Tool, OAuth, Search Engine, Other (External).
 */

'use client';

import { AxisTable } from '@/components/axis';
import type { Column, CellValue, RowData } from '@/types/table';
import type { ReactNode } from 'react';

type ReferrerCategory = 'oauth' | 'internal_tool' | 'search_engine' | 'other';

interface TopReferrerData {
  referrer_domain: string;
  category: ReferrerCategory;
  users: number;
  events: number;
}

interface TopReferrersWidgetProps {
  data: TopReferrerData[];
}

const CATEGORY_CONFIG: Record<ReferrerCategory, { label: string; color: string; bgColor: string }> = {
  internal_tool: {
    label: 'Tool',
    color: 'var(--color-main-700)',
    bgColor: 'var(--color-main-100)',
  },
  oauth: {
    label: 'OAuth',
    color: 'var(--color-info-700)',
    bgColor: 'var(--color-info-100)',
  },
  search_engine: {
    label: 'Search',
    color: 'var(--color-warning-700)',
    bgColor: 'var(--color-warning-100)',
  },
  other: {
    label: 'External',
    color: 'var(--color-content-secondary)',
    bgColor: 'var(--color-surface-raised)',
  },
};

function CategoryBadge({ category }: { category: ReferrerCategory }) {
  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.other;
  return (
    <span
      className="inline-block text-xs font-medium px-2 py-0.5 rounded-full"
      style={{ color: config.color, backgroundColor: config.bgColor }}
    >
      {config.label}
    </span>
  );
}

const columns: Column[] = [
  {
    field: 'referrer_domain',
    header: 'Referrer Domain',
    render: (value: CellValue) => (
      <span className="font-medium truncate block">{String(value)}</span>
    ),
  },
  {
    field: 'category',
    header: 'Type',
    width: 100,
    render: (value: CellValue) => (
      <CategoryBadge category={(value as ReferrerCategory) || 'other'} />
    ),
  },
  {
    field: 'users',
    header: 'Users',
    type: 'number',
    align: 'center',
    width: 90,
  },
  {
    field: 'events',
    header: 'Events',
    type: 'number',
    align: 'center',
    width: 90,
  },
];

export function TopReferrersWidget({ data }: TopReferrersWidgetProps) {
  return (
    <AxisTable
      columns={columns}
      data={data as unknown as RowData[]}
      rowKey="referrer_domain"
      sortable
      paginated={false}
      emptyMessage="No referrer data available"
    />
  );
}
