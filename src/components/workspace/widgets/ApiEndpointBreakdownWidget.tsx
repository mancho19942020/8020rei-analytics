/**
 * API Endpoint Breakdown Widget
 *
 * Horizontal bar chart showing calls per endpoint, with a detail table below.
 * Uses BaseHorizontalBarChart for the chart and AxisTable for the detail grid.
 */

'use client';

import { useMemo } from 'react';
import { BaseHorizontalBarChart } from '@/components/charts';
import { AxisTable } from '@/components/axis';
import type { Column } from '@/types/table';

interface EndpointBreakdown {
  endpoint: string;
  httpMethod: string;
  calls: number;
  avgResponseMs: number;
  p95Ms: number;
  avgResults: number;
  errors: number;
}

interface ApiEndpointBreakdownWidgetProps {
  data: EndpointBreakdown[];
}

const columns: Column[] = [
  { field: 'shortEndpoint', header: 'Endpoint', type: 'text', width: 180, sortable: true },
  { field: 'httpMethod', header: 'Method', type: 'text', width: 70, sortable: true },
  { field: 'calls', header: 'Calls', type: 'number', width: 80, sortable: true },
  { field: 'avgResponseMs', header: 'Avg ms', type: 'number', width: 80, sortable: true },
  { field: 'p95Ms', header: 'P95 ms', type: 'number', width: 80, sortable: true },
  { field: 'errors', header: 'Errors', type: 'number', width: 70, sortable: true },
];

export function ApiEndpointBreakdownWidget({ data }: ApiEndpointBreakdownWidgetProps) {
  const chartData = useMemo(
    () =>
      data.map((ep) => ({
        label: ep.endpoint.replace('/api/v1/public/', ''),
        value: ep.calls,
      })),
    [data]
  );

  const tableData = useMemo(
    () =>
      data.map((ep) => ({
        ...ep,
        shortEndpoint: ep.endpoint.replace('/api/v1/public/', ''),
      })),
    [data]
  );

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-content-tertiary text-sm">
        No endpoint data for this period
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-3">
      <div style={{ height: Math.min(data.length * 40 + 60, 200) }}>
        <BaseHorizontalBarChart
          data={chartData}
          color="var(--color-main-500)"
          yAxisWidth={160}
          tooltipFormatter={(value) => [`${value?.toLocaleString() ?? 0}`, 'Calls']}
        />
      </div>
      <div className="flex-1 min-h-0">
        <AxisTable
          columns={columns}
          data={tableData}
          rowKey="endpoint"
          sortable
          defaultPageSize={10}
          rowLabel="endpoints"
        />
      </div>
    </div>
  );
}
