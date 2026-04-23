/**
 * DM Geographic Breakdown Widget
 *
 * Table showing conversion rates by state/county.
 * Clickable: Mailed, Leads, Deals open property drilldown modal filtered by geography.
 * Uses AxisTable for consistent rendering.
 */

'use client';

import { useMemo, useState, useCallback } from 'react';
import { AxisTable, AxisTag } from '@/components/axis';
import { DmPropertyDrilldownModal } from './DmPropertyDrilldownModal';
import type { DrilldownStatus } from './DmPropertyDrilldownModal';
import type { Column, CellValue, RowData } from '@/types/table';
import type { DmGeoRow } from '@/types/dm-conversions';

interface DmGeoBreakdownWidgetProps {
  data: DmGeoRow[];
}

function formatCurrency(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

export function DmGeoBreakdownWidget({ data }: DmGeoBreakdownWidgetProps) {
  const [drilldown, setDrilldown] = useState<{
    open: boolean;
    domain: string;
    status: DrilldownStatus;
    count: number;
    county?: string;
    state?: string;
  }>({ open: false, domain: '_all', status: 'mailed', count: 0 });

  const openDrilldown = useCallback((county: string | undefined, state: string, status: DrilldownStatus, count: number) => {
    setDrilldown({ open: true, domain: '_all', status, count, county, state });
  }, []);

  const closeDrilldown = useCallback(() => {
    setDrilldown(prev => ({ ...prev, open: false }));
  }, []);

  function renderClickable(value: CellValue, row: RowData, status: DrilldownStatus) {
    const count = Number(value || 0);
    if (count === 0) return <span style={{ color: 'var(--text-tertiary)' }}>0</span>;
    const geoType = String(row?.geoType || 'county');
    const county = geoType === 'county' ? String(row?.county || row?.geoLabel || '') : undefined;
    const state = String(row?.state || '');
    return (
      <button
        type="button"
        className="cursor-pointer hover:underline font-medium bg-transparent border-0 p-0"
        style={{ color: 'var(--color-main-500)' }}
        onClick={(e) => {
          e.stopPropagation();
          openDrilldown(county, state, status, count);
        }}
        title={`View ${count} properties`}
      >
        {count.toLocaleString()}
      </button>
    );
  }

  const columns: Column[] = useMemo(() => [
    {
      field: 'geoLabel',
      header: 'Market',
      width: 180,
      minWidth: 120,
      render: (value: CellValue, row: RowData) => {
        const geoType = String(row?.geoType || 'county');
        return (
          <span className="flex items-center gap-1.5">
            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
              {String(value || '')}
            </span>
            <AxisTag color={geoType === 'county' ? 'info' : 'neutral'} size="sm">
              {geoType === 'county' ? 'County' : 'MSA'}
            </AxisTag>
          </span>
        );
      },
    },
    {
      field: 'state',
      header: 'State',
      width: 60,
    },
    {
      field: 'totalMailed',
      header: 'Mailed',
      headerTooltip: 'Unique properties mailed in this geographic area. Click to see properties.',
      type: 'number',
      width: 80,
      align: 'center',
      render: (value: CellValue, row: RowData) => renderClickable(value, row, 'mailed'),
    },
    {
      field: 'leads',
      header: 'Leads',
      headerTooltip: 'Properties that became leads in this area. Click to see properties.',
      type: 'number',
      width: 70,
      align: 'center',
      render: (value: CellValue, row: RowData) => renderClickable(value, row, 'lead'),
    },
    {
      field: 'deals',
      header: 'Deals',
      headerTooltip: 'Properties that reached deal status in this area. Click to see properties.',
      type: 'number',
      width: 70,
      align: 'center',
      render: (value: CellValue, row: RowData) => renderClickable(value, row, 'deal'),
    },
    {
      field: 'leadConversionRate',
      header: 'Lead %',
      headerTooltip: 'Lead conversion rate for this area: leads divided by mailed properties.',
      width: 80,
      align: 'center',
      render: (value: CellValue) => (
        <span style={{ color: 'var(--text-primary)' }}>{Number(value || 0).toFixed(1)}%</span>
      ),
    },
    {
      field: 'totalRevenue',
      header: 'Deal rev',
      headerTooltip: 'Deal revenue clients earned from real-estate deals closed in this area. Client ROI — NOT 8020REI company revenue.',
      width: 90,
      align: 'center',
      render: (value: CellValue) => (
        <span style={{ color: Number(value) > 0 ? 'var(--color-success-500)' : 'var(--text-primary)' }}>
          {formatCurrency(Number(value || 0))}
        </span>
      ),
    },
  ], []);

  const tableData = useMemo(() =>
    data.map((g, i) => ({
      id: `${g.state}-${g.geoLabel || g.county}-${i}`,
      geoLabel: g.geoLabel || g.county,
      geoType: g.geoType || 'county',
      county: g.county,
      state: g.state,
      totalMailed: g.totalMailed,
      leads: g.leads,
      deals: g.deals,
      leadConversionRate: g.leadConversionRate,
      totalRevenue: g.totalRevenue,
    })),
  [data]);

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6 gap-3">
        <div
          className="rounded-lg px-4 py-2"
          style={{ backgroundColor: 'var(--color-alert-50)', border: '1px solid var(--color-alert-300)' }}
        >
          <span className="text-label font-medium" style={{ color: 'var(--color-alert-700)' }}>Pending data</span>
        </div>
        <p className="text-label" style={{ color: 'var(--text-secondary)', maxWidth: '400px' }}>
          Geographic breakdown requires property-level data from <code style={{ fontSize: '12px' }}>dm_property_conversions</code>, which is pending a backend fix. This widget will populate automatically once the fix is deployed.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="h-full overflow-hidden">
        <AxisTable
          columns={columns}
          data={tableData}
          rowKey="id"
          sortable
          paginated
          resizable
          defaultPageSize={15}
          emptyMessage="No geographic data available yet"
        />
      </div>
      <DmPropertyDrilldownModal
        open={drilldown.open}
        onClose={closeDrilldown}
        domain={drilldown.domain}
        status={drilldown.status}
        expectedCount={drilldown.count}
        county={drilldown.county}
        state={drilldown.state}
      />
    </>
  );
}
