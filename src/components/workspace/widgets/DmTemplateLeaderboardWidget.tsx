/**
 * DM Template Leaderboard Widget
 *
 * Sortable table ranking templates by performance: sent, delivered, leads, deals, ROAS.
 * Uses AxisTable for consistent rendering.
 */

'use client';

import { useMemo } from 'react';
import { AxisTable, AxisTag } from '@/components/axis';
import type { Column, CellValue } from '@/types/table';
import type { DmTemplatePerformance } from '@/types/dm-conversions';

interface DmTemplateLeaderboardWidgetProps {
  data: DmTemplatePerformance[];
}

const typeColorMap: Record<string, 'info' | 'neutral' | 'alert'> = {
  letter: 'info',
  postcard: 'neutral',
  checkletter: 'alert',
};

export function DmTemplateLeaderboardWidget({ data }: DmTemplateLeaderboardWidgetProps) {
  const columns: Column[] = useMemo(() => [
    {
      field: 'templateName',
      header: 'Template',
      minWidth: 160,
      render: (value: CellValue) => (
        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
          {String(value || '')}
        </span>
      ),
    },
    {
      field: 'templateType',
      header: 'Type',
      width: 90,
      render: (value: CellValue) => {
        const v = String(value || '');
        return (
          <AxisTag color={typeColorMap[v] || 'neutral'} size="sm">
            {v || '—'}
          </AxisTag>
        );
      },
    },
    {
      field: 'totalSent',
      header: 'Sent',
      type: 'number',
      width: 80,
      align: 'center',
    },
    {
      field: 'leadsGenerated',
      header: 'Leads',
      type: 'number',
      width: 70,
      align: 'center',
    },
    {
      field: 'dealsGenerated',
      header: 'Deals',
      type: 'number',
      width: 70,
      align: 'center',
    },
    {
      field: 'leadConversionRate',
      header: 'Lead %',
      width: 80,
      align: 'center',
      render: (value: CellValue) => (
        <span style={{ color: 'var(--text-primary)' }}>{Number(value || 0).toFixed(1)}%</span>
      ),
    },
    {
      field: 'roas',
      header: 'ROAS',
      width: 80,
      align: 'center',
      render: (value: CellValue) => {
        const roas = Number(value || 0);
        return (
          <AxisTag
            color={roas >= 2 ? 'success' : roas >= 1 ? 'alert' : roas > 0 ? 'error' : 'neutral'}
            size="sm"
          >
            {roas > 0 ? `${roas.toFixed(1)}x` : '—'}
          </AxisTag>
        );
      },
    },
    {
      field: 'campaignsUsing',
      header: 'Clients',
      type: 'number',
      width: 70,
      align: 'center',
    },
  ], []);

  const tableData = useMemo(() =>
    data.map(t => ({
      id: `${t.templateId}`,
      templateName: t.templateName,
      templateType: t.templateType,
      totalSent: t.totalSent,
      leadsGenerated: t.leadsGenerated,
      dealsGenerated: t.dealsGenerated,
      leadConversionRate: t.leadConversionRate,
      roas: t.roas,
      campaignsUsing: t.campaignsUsing,
    })),
  [data]);

  return (
    <div className="h-full overflow-hidden">
      <AxisTable
        columns={columns}
        data={tableData}
        rowKey="id"
        sortable
        paginated
        resizable
        defaultPageSize={10}
        emptyMessage="No template performance data available yet"
      />
    </div>
  );
}
