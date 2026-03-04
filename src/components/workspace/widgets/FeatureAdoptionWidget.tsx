/**
 * Feature Adoption Widget
 *
 * Table showing feature adoption rate (% of clients using each feature).
 * Uses AxisTable with a custom adoption bar renderer.
 */

'use client';

import { AxisTable } from '@/components/axis';
import type { Column, CellValue, RowData } from '@/types/table';

interface FeatureAdoptionData {
  feature: string;
  clients_using: number;
  adoption_pct: number;
}

interface FeatureAdoptionWidgetProps {
  data: FeatureAdoptionData[];
}

function AdoptionBar({ percentage }: { percentage: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-surface-overlay rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${Math.min(percentage, 100)}%`,
            backgroundColor: 'var(--color-main-500)',
          }}
        />
      </div>
      <span className="text-sm font-medium text-content-primary min-w-[48px] text-right tabular-nums">
        {percentage.toFixed(1)}%
      </span>
    </div>
  );
}

const columns: Column[] = [
  {
    field: 'feature',
    header: 'Feature',
    render: (value: CellValue) => (
      <span className="font-medium">{String(value)}</span>
    ),
  },
  {
    field: 'clients_using',
    header: 'Clients',
    type: 'number',
    align: 'center',
    width: 90,
  },
  {
    field: 'adoption_pct',
    header: 'Adoption Rate',
    width: 200,
    render: (value: CellValue) => (
      <AdoptionBar percentage={typeof value === 'number' ? value : 0} />
    ),
  },
];

export function FeatureAdoptionWidget({ data }: FeatureAdoptionWidgetProps) {
  return (
    <AxisTable
      columns={columns}
      data={data as unknown as RowData[]}
      rowKey="feature"
      sortable
      paginated={false}
      emptyMessage="No adoption data available"
    />
  );
}
