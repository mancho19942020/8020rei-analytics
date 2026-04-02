/**
 * Rapid Response Campaign Table Widget
 *
 * Uses AxisTable for consistent table rendering and AxisTag for status badges.
 */

'use client';

import { useMemo } from 'react';
import { AxisTable, AxisTag } from '@/components/axis';
import type { Column, CellValue } from '@/types/table';
import type { RrCampaignSnapshot } from '@/types/rapid-response';

interface RrCampaignTableWidgetProps {
  data: RrCampaignSnapshot[];
}

const statusColorMap: Record<string, 'success' | 'alert' | 'neutral' | 'info' | 'error'> = {
  active: 'success',
  paused: 'alert',
  disabled: 'neutral',
  draft: 'info',
  eliminated: 'error',
};

const typeColorMap: Record<string, 'info' | 'neutral'> = {
  rr: 'info',
  smartdrop: 'neutral',
};

export function RrCampaignTableWidget({ data }: RrCampaignTableWidgetProps) {
  const columns: Column[] = useMemo(() => [
    {
      field: 'campaignName',
      header: 'Campaign',
      minWidth: 180,
    },
    {
      field: 'campaignType',
      header: 'Type',
      width: 70,
      render: (value: CellValue) => {
        const v = String(value || '');
        return (
          <AxisTag color={typeColorMap[v] || 'neutral'} size="sm">
            {v === 'rr' ? 'RR' : 'SD'}
          </AxisTag>
        );
      },
    },
    {
      field: 'status',
      header: 'Status',
      width: 90,
      render: (value: CellValue) => {
        const v = String(value || '');
        return (
          <AxisTag color={statusColorMap[v] || 'neutral'} size="sm" dot>
            {v}
          </AxisTag>
        );
      },
    },
    {
      field: 'totalSent',
      header: 'Sent',
      type: 'number',
      width: 90,
      align: 'center',
    },
    {
      field: 'totalDelivered',
      header: 'Delivered',
      type: 'number',
      width: 90,
      align: 'center',
    },
    {
      field: 'onHoldCount',
      header: 'On Hold',
      width: 80,
      align: 'center',
      render: (value: CellValue) => (
        <span
          className={Number(value) > 0 ? 'font-semibold' : ''}
          style={{ color: Number(value) > 0 ? 'var(--color-error-500)' : 'var(--text-primary)' }}
        >
          {value}
        </span>
      ),
    },
  ], []);

  const tableData = useMemo(() =>
    data.map(c => ({
      id: c.campaignId,
      campaignName: c.campaignName,
      campaignType: c.campaignType,
      status: c.status,
      totalSent: c.totalSent,
      totalDelivered: c.totalDelivered,
      onHoldCount: c.onHoldCount,
    })),
  [data]);

  return (
    <div className="h-full overflow-hidden">
      <AxisTable
        columns={columns}
        data={tableData}
        rowKey="id"
        sortable
        paginated={false}
        emptyMessage="No campaign data available yet"
      />
    </div>
  );
}
