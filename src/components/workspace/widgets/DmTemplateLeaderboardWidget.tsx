/**
 * DM Template Leaderboard Widget
 *
 * Sortable table ranking templates by performance: domain, sent, delivered, leads, deals, ROAS.
 * Includes data integrity indicators (ROAS confidence, delivery warnings).
 */

'use client';

import { useMemo } from 'react';
import { AxisTable, AxisTag, AxisTooltip } from '@/components/axis';
import type { Column, CellValue, RowData } from '@/types/table';
import type { DmTemplatePerformance } from '@/types/dm-conversions';

interface DmTemplateLeaderboardWidgetProps {
  data: DmTemplatePerformance[];
}

const typeColorMap: Record<string, 'info' | 'neutral' | 'alert'> = {
  letter: 'info',
  postcard: 'neutral',
  checkletter: 'alert',
  'classic-checkletter': 'alert',
  'about-us': 'info',
  steps: 'neutral',
};

function formatDomain(domain: string): string {
  return domain
    .replace(/_8020rei_com$/i, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim() || domain;
}

export function DmTemplateLeaderboardWidget({ data }: DmTemplateLeaderboardWidgetProps) {
  const columns: Column[] = useMemo(() => [
    {
      field: 'domainDisplay',
      header: 'Client',
      width: 140,
      minWidth: 100,
      render: (value: CellValue) => (
        <span className="text-label" style={{ color: 'var(--text-secondary)' }}>
          {String(value || '')}
        </span>
      ),
    },
    {
      field: 'templateName',
      header: 'Template',
      width: 150,
      minWidth: 100,
      render: (value: CellValue) => {
        const name = String(value || '');
        const isUnknown = name === 'Unknown template' || !name;
        if (isUnknown) {
          return (
            <AxisTooltip
              content="This campaign's mail was sent without a linked template in the platform. The sends and conversions are real, but we can't identify which template design was used."
              placement="top"
              maxWidth={300}
            >
              <span className="font-medium" style={{ color: 'var(--text-tertiary)' }}>
                Unknown template
              </span>
            </AxisTooltip>
          );
        }
        return (
          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
            {name}
          </span>
        );
      },
    },
    {
      field: 'templateType',
      header: 'Type',
      width: 120,
      minWidth: 80,
      render: (value: CellValue) => {
        const v = String(value || '');
        const isUnknown = v === 'unknown' || !v;
        if (isUnknown) {
          return (
            <AxisTooltip
              content="Template type is unavailable because the campaign was not linked to a template in the platform."
              placement="top"
              maxWidth={280}
            >
              <AxisTag color="neutral" size="sm">
                unknown
              </AxisTag>
            </AxisTooltip>
          );
        }
        return (
          <AxisTag color={typeColorMap[v] || 'neutral'} size="sm">
            {v}
          </AxisTag>
        );
      },
    },
    {
      field: 'totalSent',
      header: 'Sent',
      type: 'number',
      width: 80,
      minWidth: 60,
      align: 'center',
    },
    {
      field: 'totalDelivered',
      header: 'Delivered',
      width: 90,
      minWidth: 70,
      align: 'center',
      render: (value: CellValue, row: RowData) => {
        const delivered = Number(value || 0);
        const warning = row?.deliveryWarning === true;
        return (
          <span style={{ color: warning ? 'var(--color-alert-500)' : 'var(--text-primary)' }}>
            {delivered.toLocaleString()}
            {warning && (
              <span title="No delivery data — leads exist without confirmed delivery" style={{ marginLeft: '4px' }}>
                ⚠
              </span>
            )}
          </span>
        );
      },
    },
    {
      field: 'leadsGenerated',
      header: 'Leads',
      type: 'number',
      width: 70,
      minWidth: 60,
      align: 'center',
    },
    {
      field: 'dealsGenerated',
      header: 'Deals',
      type: 'number',
      width: 70,
      minWidth: 60,
      align: 'center',
    },
    {
      field: 'leadConversionRate',
      header: 'Lead %',
      width: 70,
      minWidth: 60,
      align: 'center',
      render: (value: CellValue) => (
        <span style={{ color: 'var(--text-primary)' }}>{Number(value || 0).toFixed(1)}%</span>
      ),
    },
    {
      field: 'roas',
      header: 'ROAS',
      width: 110,
      minWidth: 80,
      align: 'center',
      render: (value: CellValue, row: RowData) => {
        const roas = Number(value || 0);
        const confidence = String(row?.roasConfidence || 'none');
        const deals = Number(row?.dealsGenerated || 0);

        if (confidence === 'revenue_no_deal') {
          return (
            <AxisTooltip
              content="Revenue was recorded but no property has reached Deal status yet. This is under review."
              placement="top"
              maxWidth={280}
            >
              <span style={{ color: 'var(--text-tertiary)' }}>— ⚠</span>
            </AxisTooltip>
          );
        }

        if (confidence === 'none' || roas === 0) {
          return (
            <AxisTooltip
              content="No deals closed yet, so ROAS can't be calculated."
              placement="top"
              maxWidth={240}
            >
              <span style={{ color: 'var(--text-tertiary)' }}>—</span>
            </AxisTooltip>
          );
        }

        const tooltipText = confidence === 'low_sample'
          ? `Based on ${deals} ${deals === 1 ? 'deal' : 'deals'} only. Needs 3+ deals for a confident rating.`
          : `Based on ${deals} deals. Revenue ÷ cost = ${roas.toFixed(1)}x return.`;

        const tagColor = roas >= 2 ? 'success' as const : roas >= 1 ? 'alert' as const : 'error' as const;

        return (
          <AxisTooltip content={tooltipText} placement="top" maxWidth={280}>
            <AxisTag color={tagColor} size="sm">
              {roas.toFixed(1)}x
            </AxisTag>
          </AxisTooltip>
        );
      },
    },
  ], []);

  const tableData = useMemo(() =>
    data.map(t => ({
      id: `${t.domain}-${t.templateId}`,
      domainDisplay: formatDomain(t.domain),
      templateName: t.templateName,
      templateType: t.templateType,
      totalSent: t.totalSent,
      totalDelivered: t.totalDelivered,
      leadsGenerated: t.leadsGenerated,
      dealsGenerated: t.dealsGenerated,
      leadConversionRate: t.leadConversionRate,
      roas: t.roas,
      roasConfidence: t.roasConfidence,
      deliveryWarning: t.deliveryWarning,
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
