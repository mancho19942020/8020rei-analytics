/**
 * Device Language Widget
 *
 * Displays device language distribution (en-us, es, etc.)
 * as a table with users and events.
 * Uses AxisTable for consistent design system styling.
 */

'use client';

import { useMemo } from 'react';
import { AxisTable } from '@/components/axis';
import type { Column, RowData } from '@/types/table';

interface LanguageData {
  language: string;
  users: number;
  events: number;
}

interface DeviceLanguageWidgetProps {
  data: LanguageData[];
}

function getLanguageDisplayName(code: string): string {
  if (!code || code === '(not set)') return '(not set)';

  try {
    const displayNames = new Intl.DisplayNames(['en'], { type: 'language' });
    const displayName = displayNames.of(code.split('-')[0]);
    if (displayName) {
      const parts = code.split('-');
      if (parts.length > 1) {
        return `${displayName} (${parts[1].toUpperCase()})`;
      }
      return displayName;
    }
  } catch {
    // Fallback to uppercase code
  }

  return code.toUpperCase();
}

export function DeviceLanguageWidget({ data }: DeviceLanguageWidgetProps) {
  const totalUsers = useMemo(
    () => data.reduce((sum, item) => sum + item.users, 0),
    [data]
  );

  const columns: Column[] = useMemo(() => [
    {
      field: 'displayName',
      header: 'Language',
      type: 'text',
      sortable: true,
      render: (value) => (
        <span className="font-medium">{String(value)}</span>
      ),
    },
    {
      field: 'language',
      header: 'Code',
      type: 'text',
      sortable: true,
      render: (value) => (
        <span className="font-mono text-xs text-content-tertiary">
          {String(value || '—')}
        </span>
      ),
    },
    {
      field: 'users',
      header: 'Users',
      type: 'number',
      sortable: true,
    },
    {
      field: 'percentage',
      header: '%',
      type: 'percentage',
      sortable: true,
    },
    {
      field: 'events',
      header: 'Events',
      type: 'number',
      sortable: true,
    },
  ], []);

  const tableData: RowData[] = useMemo(() =>
    data.map((item, index) => ({
      ...item,
      _id: `${item.language || 'unknown'}-${index}`,
      displayName: getLanguageDisplayName(item.language),
      percentage: totalUsers > 0 ? item.users / totalUsers : 0,
    })),
    [data, totalUsers]
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 min-h-0">
        <AxisTable
          columns={columns}
          data={tableData}
          rowKey="_id"
          sortable
          paginated={false}
          emptyMessage="No language data available"
        />
      </div>
    </div>
  );
}
