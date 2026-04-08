/**
 * DM Property Drilldown Modal
 *
 * Opens when clicking a number (Mailed, Leads, Deals, etc.) in the client
 * performance table. Shows the actual property-level data from
 * dm_property_conversions so users can verify exactly which properties
 * became leads, deals, etc.
 */

'use client';

import { useState, useEffect } from 'react';
import { AxisModal } from '@/components/axis';
import { AxisTag } from '@/components/axis';

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

  useEffect(() => {
    if (!open || !domain) return;

    let cancelled = false;
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

  // Determine which date column to show based on status
  const showConversionDate = !['mailed', 'sent', 'delivered'].includes(status);
  const isSendView = status === 'sent' || status === 'delivered' || status === 'mailed';

  return (
    <AxisModal open={open} onClose={onClose} title={title} size="lg">
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
        <div>
          {/* Summary bar */}
          <div
            className="flex items-center gap-3 mb-4 pb-3"
            style={{ borderBottom: '1px solid var(--border-subtle)' }}
          >
            <span className="text-label" style={{ color: 'var(--text-secondary)' }}>
              Showing {data.length} properties
              {data.length !== expectedCount && expectedCount > 0 && (
                <span style={{ color: 'var(--color-alert-500)' }}>
                  {' '}(table shows {expectedCount} — data may still be syncing)
                </span>
              )}
            </span>
          </div>

          {/* Property list */}
          <div className="overflow-x-auto">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr
                  style={{
                    borderBottom: '2px solid var(--border-default)',
                    textAlign: 'left',
                  }}
                >
                  <th className="text-label font-medium py-2 pr-3" style={{ color: 'var(--text-secondary)' }}>
                    Address
                  </th>
                  <th className="text-label font-medium py-2 pr-3" style={{ color: 'var(--text-secondary)' }}>
                    Status
                  </th>
                  <th className="text-label font-medium py-2 pr-3" style={{ color: 'var(--text-secondary)' }}>
                    Template
                  </th>
                  <th className="text-label font-medium py-2 pr-3" style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
                    Sends
                  </th>
                  {isSendView && (
                    <th className="text-label font-medium py-2 pr-3" style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
                      Delivered
                    </th>
                  )}
                  {showConversionDate && (
                    <th className="text-label font-medium py-2 pr-3" style={{ color: 'var(--text-secondary)' }}>
                      Converted
                    </th>
                  )}
                  <th className="text-label font-medium py-2 pr-3" style={{ color: 'var(--text-secondary)' }}>
                    {isSendView ? 'Sent date' : 'First sent'}
                  </th>
                  {status === 'deal' && (
                    <th className="text-label font-medium py-2" style={{ color: 'var(--text-secondary)', textAlign: 'right' }}>
                      Revenue
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {data.map((p, i) => (
                  <tr
                    key={`${p.propertyId}-${i}`}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                    }}
                  >
                    <td className="py-2.5 pr-3" style={{ color: 'var(--text-primary)', maxWidth: 250 }}>
                      <div className="font-medium text-sm truncate" title={p.address}>
                        {p.address}
                      </div>
                      {(p.county || p.state) && (
                        <div className="text-label" style={{ color: 'var(--text-tertiary)' }}>
                          {[p.county, p.state].filter(Boolean).join(', ')}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 pr-3">
                      <AxisTag
                        color={STATUS_TAG_COLORS[p.currentStatus] || 'neutral'}
                        size="sm"
                      >
                        {p.currentStatus}
                      </AxisTag>
                      {p.isBackfilled && (
                        <span className="text-xs ml-1" style={{ color: 'var(--text-tertiary)' }}>
                          *
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 pr-3" style={{ maxWidth: 180 }}>
                      <div className="text-sm truncate" style={{ color: 'var(--text-primary)' }} title={p.templateName}>
                        {p.templateName}
                      </div>
                      <div className="text-label" style={{ color: 'var(--text-tertiary)' }}>
                        {p.templateType}
                      </div>
                    </td>
                    <td className="py-2.5 pr-3 text-center" style={{ color: 'var(--text-primary)' }}>
                      {p.totalSends}
                    </td>
                    {isSendView && (
                      <td className="py-2.5 pr-3 text-center" style={{ color: 'var(--text-primary)' }}>
                        {p.totalDelivered}
                      </td>
                    )}
                    {showConversionDate && (
                      <td className="py-2.5 pr-3">
                        <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                          {status === 'lead' && formatDate(p.becameLeadAt)}
                          {status === 'appointment' && formatDate(p.becameAppointmentAt)}
                          {status === 'contract' && formatDate(p.becameContractAt)}
                          {status === 'deal' && formatDate(p.becameDealAt)}
                        </span>
                        {status === 'lead' && p.daysToLead !== null && (
                          <span className="text-label ml-1" style={{ color: 'var(--text-tertiary)' }}>
                            ({p.daysToLead}d)
                          </span>
                        )}
                      </td>
                    )}
                    <td className="py-2.5 pr-3">
                      <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                        {formatDate(p.firstSentDate)}
                      </span>
                    </td>
                    {status === 'deal' && (
                      <td className="py-2.5 text-right">
                        <span className="text-sm font-medium" style={{
                          color: p.dealRevenue && p.dealRevenue > 0
                            ? 'var(--color-success-500)'
                            : 'var(--text-primary)',
                        }}>
                          {p.dealRevenue !== null ? `$${p.dealRevenue.toLocaleString()}` : '—'}
                        </span>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer note for backfilled data */}
          {data.some(p => p.isBackfilled) && (
            <p className="text-label mt-4" style={{ color: 'var(--text-tertiary)' }}>
              * Conversion dates marked with * are system-estimated (backfilled), not organic timestamps.
            </p>
          )}
        </div>
      )}
    </AxisModal>
  );
}
