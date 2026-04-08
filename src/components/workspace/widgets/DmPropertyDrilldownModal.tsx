/**
 * DM Property Drilldown Modal
 *
 * Opens when clicking a number (Mailed, Leads, Deals, etc.) in the client
 * performance table. Shows the actual property-level data from
 * dm_property_conversions so users can verify exactly which properties
 * became leads, deals, etc.
 *
 * Uses AxisTable for consistent rendering with sorting, pagination, and search.
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { AxisModal } from '@/components/axis';
import { AxisTable, AxisTag, AxisTooltip } from '@/components/axis';
import type { Column, CellValue, RowData } from '@/types/table';

export type DrilldownStatus = 'mailed' | 'lead' | 'appointment' | 'contract' | 'deal' | 'sent' | 'delivered';

interface DrilldownProperty {
  propertyId: number;
  address: string;
  county: string;
  state: string;
  campaignName: string;
  campaignType: string;
  templateName: string;
  templateType: string;
  currentStatus: string;
  firstSentDate: string | null;
  lastSentDate: string | null;
  totalSends: number;
  totalDelivered: number;
  totalCost: number;
  becameLeadAt: string | null;
  becameAppointmentAt: string | null;
  becameContractAt: string | null;
  becameDealAt: string | null;
  dealRevenue: number | null;
  daysToLead: number | null;
  daysToDeal: number | null;
  attributionStatus: string;
  isBackfilled: boolean;
}

interface DmPropertyDrilldownModalProps {
  open: boolean;
  onClose: () => void;
  domain: string;
  status: DrilldownStatus;
  expectedCount: number;
  /** Optional campaign ID filter (for Operational Health drilldown) */
  campaignId?: number;
  /** Optional campaign name for the modal title */
  campaignName?: string;
}

const STATUS_LABELS: Record<DrilldownStatus, string> = {
  mailed: 'Properties mailed',
  lead: 'Properties that became leads',
  appointment: 'Properties with appointments',
  contract: 'Properties under contract',
  deal: 'Properties with closed deals',
  sent: 'Properties sent',
  delivered: 'Properties delivered',
};

const STATUS_TAG_COLORS: Record<string, 'success' | 'info' | 'alert' | 'neutral' | 'error'> = {
  Deal: 'success',
  Contract: 'alert',
  Appointment: 'info',
  Lead: 'info',
  Prospect: 'neutral',
};

function formatDomain(domain: string): string {
  return domain
    .replace(/_8020rei_com$/i, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim() || domain;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}

export function DmPropertyDrilldownModal({
  open,
  onClose,
  domain,
  status,
  expectedCount,
  campaignId,
  campaignName,
}: DmPropertyDrilldownModalProps) {
  const [data, setData] = useState<DrilldownProperty[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!open || !domain) return;

    let cancelled = false;
    setSearch('');
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        let url = `/api/dm-conversions?type=property-drilldown&domain=${encodeURIComponent(domain)}&status=${status}`;
        if (campaignId) url += `&campaignId=${campaignId}`;
        const res = await fetch(url).then(r => r.json());
        if (!cancelled) {
          if (res.success) {
            setData(res.data);
          } else {
            setError(res.error || 'Failed to load data');
          }
        }
      } catch {
        if (!cancelled) setError('Failed to connect');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [open, domain, status, campaignId]);

  const domainLabel = domain === '_all' ? 'All clients' : formatDomain(domain);
  const title = campaignName
    ? `${domainLabel} — ${campaignName} — ${STATUS_LABELS[status]}`
    : `${domainLabel} — ${STATUS_LABELS[status]}`;

  const showConversionDate = !['mailed', 'sent', 'delivered'].includes(status);
  const isSendView = status === 'sent' || status === 'delivered' || status === 'mailed';

  const columns: Column[] = useMemo(() => {
    const cols: Column[] = [
      {
        field: 'address',
        header: 'Address',
        width: 220,
        minWidth: 160,
        render: (value: CellValue, row: RowData) => {
          const county = String(row?.county || '');
          const state = String(row?.state || '');
          const location = [county, state].filter(Boolean).join(', ');
          return (
            <span title={String(value || '')}>
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                {String(value || '')}
              </span>
              {location && (
                <span className="ml-1 text-label" style={{ color: 'var(--text-tertiary)' }}>
                  ({location})
                </span>
              )}
            </span>
          );
        },
      },
      {
        field: 'currentStatus',
        header: 'Status',
        width: 90,
        minWidth: 80,
        align: 'center',
        render: (value: CellValue, row: RowData) => {
          const backfilled = Boolean(row?.isBackfilled);
          return (
            <span>
              <AxisTag color={STATUS_TAG_COLORS[String(value)] || 'neutral'} size="sm">
                {String(value || '')}
              </AxisTag>
              {backfilled && (
                <span className="text-xs ml-0.5" style={{ color: 'var(--text-tertiary)' }}>*</span>
              )}
            </span>
          );
        },
      },
      {
        field: 'templateName',
        header: 'Template',
        width: 140,
        minWidth: 100,
        render: (value: CellValue) => {
          const name = String(value || '');
          const isUnknown = name === 'Unknown template' || name === '—' || !name;
          if (isUnknown) {
            return (
              <AxisTooltip
                content="This property's mail was sent without a linked template in the platform. The sends and conversions are real, but we can't identify which template design was used."
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
        field: 'totalSends',
        header: 'Sends',
        type: 'number',
        width: 70,
        minWidth: 60,
        align: 'center',
      },
    ];

    if (isSendView) {
      cols.push({
        field: 'totalDelivered',
        header: 'Delivered',
        type: 'number',
        width: 80,
        minWidth: 70,
        align: 'center',
      });
    }

    if (showConversionDate) {
      cols.push({
        field: 'convertedAt',
        header: 'Converted',
        width: 120,
        minWidth: 90,
        render: (value: CellValue, row: RowData) => {
          const dateStr = formatDate(String(value || '') || null);
          const daysToLead = Number(row?.daysToLead ?? '');
          const showDays = status === 'lead' && !isNaN(daysToLead);
          return (
            <span style={{ color: 'var(--text-primary)' }}>
              {dateStr}
              {showDays && (
                <span className="text-label ml-1" style={{ color: 'var(--text-tertiary)' }}>
                  ({daysToLead}d)
                </span>
              )}
            </span>
          );
        },
      });
    }

    cols.push({
      field: 'firstSentDate',
      header: isSendView ? 'Sent date' : 'First sent',
      width: 110,
      minWidth: 90,
      render: (value: CellValue) => (
        <span style={{ color: 'var(--text-primary)' }}>
          {formatDate(String(value || '') || null)}
        </span>
      ),
    });

    if (status === 'deal') {
      cols.push({
        field: 'dealRevenue',
        header: 'Revenue',
        width: 100,
        minWidth: 80,
        align: 'center',
        render: (value: CellValue) => {
          const rev = Number(value || 0);
          return (
            <span className="font-medium" style={{
              color: rev > 0 ? 'var(--color-success-500)' : 'var(--text-primary)',
            }}>
              {rev !== 0 ? `$${rev.toLocaleString()}` : '—'}
            </span>
          );
        },
      });
    }

    return cols;
  }, [status, isSendView, showConversionDate]);

  const tableData = useMemo(() => {
    const lowerSearch = search.toLowerCase();

    const mapped = data.map((p, i) => {
      // Pick the right conversion date based on status
      let convertedAt: string | null = null;
      if (status === 'lead') convertedAt = p.becameLeadAt;
      else if (status === 'appointment') convertedAt = p.becameAppointmentAt;
      else if (status === 'contract') convertedAt = p.becameContractAt;
      else if (status === 'deal') convertedAt = p.becameDealAt;

      return {
        id: `${p.propertyId}-${i}`,
        address: p.address,
        county: p.county,
        state: p.state,
        currentStatus: p.currentStatus,
        templateName: p.templateName || '',
        totalSends: p.totalSends,
        totalDelivered: p.totalDelivered,
        convertedAt: convertedAt || '',
        firstSentDate: p.firstSentDate || '',
        dealRevenue: p.dealRevenue ?? 0,
        isBackfilled: p.isBackfilled,
        daysToLead: p.daysToLead,
      };
    });

    if (!search) return mapped;

    return mapped.filter(row =>
      row.address.toLowerCase().includes(lowerSearch) ||
      row.county.toLowerCase().includes(lowerSearch) ||
      row.state.toLowerCase().includes(lowerSearch) ||
      row.currentStatus.toLowerCase().includes(lowerSearch) ||
      row.templateName.toLowerCase().includes(lowerSearch)
    );
  }, [data, search, status]);

  return (
    <AxisModal open={open} onClose={onClose} title={title} size="xl" fitContent>
      {loading ? (
        <div className="flex items-center justify-center py-12" style={{ color: 'var(--text-secondary)' }}>
          Loading properties...
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
          {error === 'Failed to connect' ? null : (
            <p className="text-label" style={{ color: 'var(--text-tertiary)' }}>
              Property-level data may not be available yet. The dm_property_conversions table
              needs to be populated by the monolith extraction job.
            </p>
          )}
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <p style={{ color: 'var(--text-secondary)' }}>
            No property-level data available yet
          </p>
          <p className="text-label" style={{ color: 'var(--text-tertiary)' }}>
            The table shows {expectedCount} {status === 'mailed' ? 'mailed' : status + 's'} from
            aggregate data, but the property-level detail table (dm_property_conversions) is still
            populating. Check back after the next overnight sync.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3" style={{ flex: 1, minHeight: 0 }}>
          {/* Summary bar + search */}
          <div className="flex items-center justify-between gap-3 flex-shrink-0">
            <span className="text-label" style={{ color: 'var(--text-secondary)' }}>
              {search
                ? `${tableData.length} of ${data.length} properties`
                : `${data.length} properties`
              }
              {data.length !== expectedCount && expectedCount > 0 && !search && (
                <span style={{ color: 'var(--color-alert-500)' }}>
                  {' '}(table shows {expectedCount} — data may still be syncing)
                </span>
              )}
            </span>
            <input
              type="text"
              placeholder="Search address, county, status..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-surface-raised border border-stroke rounded-lg px-3 py-1.5 text-body-regular text-content-primary placeholder:text-content-tertiary focus:outline-none focus:ring-2 focus:ring-main-500 focus:border-main-500"
              style={{ width: 260 }}
            />
          </div>

          {/* Table — position:absolute gives AxisTable a definite height for h-full */}
          <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0 }}>
              <AxisTable
                columns={columns}
                data={tableData}
                rowKey="id"
                sortable
                paginated
                resizable
                defaultPageSize={25}
                emptyMessage={search ? 'No properties match your search' : 'No property data available'}
              />
            </div>
          </div>

          {/* Footer note for backfilled data */}
          {data.some(p => p.isBackfilled) && (
            <p className="text-label flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>
              * Conversion dates marked with * are system-estimated (backfilled), not organic timestamps.
            </p>
          )}
        </div>
      )}
    </AxisModal>
  );
}
