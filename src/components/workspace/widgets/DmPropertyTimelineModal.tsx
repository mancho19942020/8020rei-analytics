/**
 * DM Property Timeline Modal
 *
 * Drill-down modal showing the full mailing + conversion history for a single property.
 * Triggered from the client performance table.
 */

'use client';

import { useState, useEffect } from 'react';
import { AxisButton, AxisTag } from '@/components/axis';
import type { DmPropertyConversion } from '@/types/dm-conversions';
import { authFetch } from '@/lib/auth-fetch';

interface DmPropertyTimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: number | null;
  domain?: string;
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

const statusColors: Record<string, 'success' | 'info' | 'alert' | 'neutral' | 'error'> = {
  Lead: 'info',
  Appointment: 'alert',
  Contract: 'neutral',
  Deal: 'success',
  Prospect: 'neutral',
};

export function DmPropertyTimelineModal({ isOpen, onClose, propertyId, domain }: DmPropertyTimelineModalProps) {
  const [data, setData] = useState<DmPropertyConversion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !propertyId) return;

    let cancelled = false;
    const fetchTimeline = async () => {
      setLoading(true);
      try {
        const domainParam = domain ? `&domain=${encodeURIComponent(domain)}` : '';
        const res = await authFetch(`/api/dm-conversions?type=property-timeline&propertyId=${propertyId}${domainParam}`).then(r => r.json());
        if (!cancelled && res.success) setData(res.data);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchTimeline();
    return () => { cancelled = true; };
  }, [isOpen, propertyId, domain]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'var(--surface-overlay)' }}
      onClick={onClose}
    >
      <div
        className="rounded-xl shadow-lg w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col"
        style={{ backgroundColor: 'var(--surface-base)', border: '1px solid var(--border-default)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid var(--border-default)' }}
        >
          <div>
            <h3 className="text-h4 font-semibold" style={{ color: 'var(--text-primary)' }}>
              Property timeline
            </h3>
            {data.length > 0 && (
              <p className="text-label mt-1" style={{ color: 'var(--text-secondary)' }}>
                {data[0].address} — {data[0].county}, {data[0].state}
              </p>
            )}
          </div>
          <AxisButton variant="ghost" onClick={onClose}>Close</AxisButton>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12" style={{ color: 'var(--text-secondary)' }}>
              Loading property history...
            </div>
          ) : data.length === 0 ? (
            <div className="flex items-center justify-center py-12" style={{ color: 'var(--text-secondary)' }}>
              No data found for this property
            </div>
          ) : (
            <div className="space-y-6">
              {data.map((entry, i) => (
                <div
                  key={`${entry.campaignId}-${i}`}
                  className="rounded-lg p-4"
                  style={{ border: '1px solid var(--border-default)', backgroundColor: 'var(--surface-raised)' }}
                >
                  {/* Campaign info */}
                  <div className="flex items-center gap-2 mb-3">
                    <AxisTag color={entry.campaignType === 'rr' ? 'info' : 'neutral'} size="sm">
                      {entry.campaignType === 'rr' ? 'RR' : 'SD'}
                    </AxisTag>
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {entry.campaignName}
                    </span>
                    <span className="text-label" style={{ color: 'var(--text-tertiary)' }}>
                      — {entry.templateName} ({entry.templateType})
                    </span>
                  </div>

                  {/* Send info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                    <div>
                      <span className="text-label block" style={{ color: 'var(--text-secondary)' }}>First sent</span>
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {formatDate(entry.firstSentDate)}
                      </span>
                    </div>
                    <div>
                      <span className="text-label block" style={{ color: 'var(--text-secondary)' }}>Last sent</span>
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {formatDate(entry.lastSentDate)}
                      </span>
                    </div>
                    <div>
                      <span className="text-label block" style={{ color: 'var(--text-secondary)' }}>Total sends</span>
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {entry.totalSends} ({entry.totalDelivered} delivered)
                      </span>
                    </div>
                    <div>
                      <span className="text-label block" style={{ color: 'var(--text-secondary)' }}>Cost</span>
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        ${entry.totalCost.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Conversion timeline */}
                  <div
                    className="pt-3 flex flex-wrap gap-3"
                    style={{ borderTop: '1px solid var(--border-subtle)' }}
                  >
                    <AxisTag color={statusColors[entry.currentStatus] || 'neutral'} size="sm" dot>
                      {entry.currentStatus}
                    </AxisTag>
                    {entry.becameLeadAt && (
                      <span className="text-label" style={{ color: 'var(--text-secondary)' }}>
                        Lead: {formatDate(entry.becameLeadAt)}
                        {entry.daysToLead !== null && ` (${entry.daysToLead}d)`}
                      </span>
                    )}
                    {entry.becameAppointmentAt && (
                      <span className="text-label" style={{ color: 'var(--text-secondary)' }}>
                        Appt: {formatDate(entry.becameAppointmentAt)}
                      </span>
                    )}
                    {entry.becameContractAt && (
                      <span className="text-label" style={{ color: 'var(--text-secondary)' }}>
                        Contract: {formatDate(entry.becameContractAt)}
                      </span>
                    )}
                    {entry.becameDealAt && (
                      <span className="text-label" style={{ color: 'var(--text-secondary)' }}>
                        Deal: {formatDate(entry.becameDealAt)}
                        {entry.dealRevenue !== null && ` — $${entry.dealRevenue.toLocaleString()}`}
                      </span>
                    )}
                    {entry.conversionConfidence === 'pre_send' && (
                      <AxisTag color="error" size="sm">Pre-send conversion (excluded)</AxisTag>
                    )}
                    {entry.conversionConfidence === 'flagged' && (
                      <AxisTag color="alert" size="sm">Late upload — dates may be inaccurate</AxisTag>
                    )}
                    {entry.shortConversionWarning && (
                      <AxisTag color="alert" size="sm">Fast close (&lt;30d)</AxisTag>
                    )}
                    {entry.isBackfilled && entry.conversionConfidence !== 'flagged' && (
                      <AxisTag color="alert" size="sm">Backfilled dates</AxisTag>
                    )}
                    {entry.attributionStatus === 'unattributed' && (
                      <AxisTag color="alert" size="sm">Unattributed</AxisTag>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
