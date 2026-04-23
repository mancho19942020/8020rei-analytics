/**
 * PCM Mismatch Table Widget (Domain Breakdown)
 *
 * Shows per-domain send totals from Aurora.
 * Will show PCM comparison column when order access is resolved.
 * Also shows the PCM design catalog at the bottom.
 */

'use client';

import { AxisTable } from '@/components/axis';
import type { Column } from '@/types/table';

interface PcmMismatchTableWidgetProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  designs: any;
}

export function PcmMismatchTableWidget({ data, designs }: PcmMismatchTableWidgetProps) {
  const domainList = data?.domains ?? [];
  const designList = designs?.designs ?? [];

  return (
    <div className="flex flex-col gap-4 h-full px-3 py-2 overflow-y-auto">
      {/* Domain breakdown table */}
      <div>
        <div className="text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
          Per-domain Aurora totals (latest snapshot)
        </div>
        {domainList.length > 0 ? (
          <AxisTable
            columns={[
              { field: 'domain', header: 'Domain', sortable: true },
              { field: 'sends', header: 'Sends', sortable: true, align: 'right', type: 'number' },
              { field: 'delivered', header: 'Delivered', sortable: true, align: 'right', type: 'number' },
              { field: 'mailed', header: 'Mailed', sortable: true, align: 'right', type: 'number' },
              { field: 'cost', header: 'Cost', sortable: true, align: 'right', type: 'currency' },
              { field: 'rate', header: '$/piece', sortable: true, align: 'right' },
            ] as Column[]}
            data={domainList.map((d: { domain: string; sends: number; delivered: number; mailed: number; cost: number }) => ({
              domain: d.domain,
              sends: d.sends,
              delivered: d.delivered,
              mailed: d.mailed,
              cost: d.cost,
              rate: d.sends > 0 ? `$${(d.cost / d.sends).toFixed(2)}` : '—',
            }))}
            sortable
          />
        ) : (
          <div className="text-xs py-4 text-center" style={{ color: 'var(--text-tertiary)' }}>
            No domain data available.
          </div>
        )}
      </div>

      {/* PCM Design catalog */}
      {designList.length > 0 && (
        <div>
          <div className="text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            PCM design catalog ({designList.length} templates)
          </div>
          <AxisTable
            columns={[
              { field: 'name', header: 'Template name', sortable: true },
              { field: 'productType', header: 'Type', sortable: true },
              { field: 'size', header: 'Size', sortable: true },
              { field: 'mailClasses', header: 'Mail classes' },
              { field: 'approvedDate', header: 'Approved', sortable: true },
            ] as Column[]}
            data={designList.map((d: { designID: number; name: string; productType: string; size: string; mailClasses: string[]; approvedDate: string }) => ({
              name: d.name,
              productType: d.productType,
              size: d.size,
              mailClasses: d.mailClasses?.join(', ') || '—',
              approvedDate: d.approvedDate
                ? new Date(d.approvedDate).toLocaleDateString()
                : '—',
            }))}
            sortable
          />
        </div>
      )}
    </div>
  );
}
