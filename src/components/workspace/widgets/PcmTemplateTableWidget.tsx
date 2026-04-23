/**
 * PCM Template Table Widget
 *
 * PCM design catalog showing available mail templates using AxisTable.
 * Data source: PostcardMania API /design endpoint
 */

'use client';

import { useMemo } from 'react';
import { AxisTable } from '@/components/axis';
import type { Column } from '@/types/table';

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  designs: any;
}

const columns: Column[] = [
  { field: 'name', header: 'Template name', sortable: true, width: 200, minWidth: 140 },
  { field: 'productType', header: 'Type', sortable: true, width: 100 },
  { field: 'size', header: 'Size', sortable: true, width: 80 },
  { field: 'mailClasses', header: 'Mail classes', width: 120 },
  { field: 'approvedDate', header: 'Approved', sortable: true, width: 100 },
];

export function PcmTemplateTableWidget({ designs }: Props) {
  const tableData = useMemo(() => {
    const designList = designs?.designs ?? [];
    return designList.map((d: { designID: number; name: string; productType: string; size: string; mailClasses: string[]; approvedDate: string }) => ({
      id: String(d.designID),
      name: d.name,
      productType: d.productType,
      size: d.size,
      mailClasses: d.mailClasses?.join(', ') || '—',
      approvedDate: d.approvedDate ? new Date(d.approvedDate).toLocaleDateString() : '—',
    }));
  }, [designs]);

  if (tableData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm" style={{ color: 'var(--text-tertiary)' }}>
        No template data available
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden">
      <AxisTable columns={columns} data={tableData} rowKey="id" sortable />
    </div>
  );
}
