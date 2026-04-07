/**
 * DM Conversion Funnel Overview Widget
 *
 * Horizontal funnel: Prospect → Lead → Appointment → Contract → Deal
 * Shows counts and conversion rates at each step.
 */

'use client';

import type { DmFunnelOverview } from '@/types/dm-conversions';

interface DmFunnelOverviewWidgetProps {
  data: DmFunnelOverview;
}

interface FunnelStep {
  label: string;
  count: number;
  rate: number | null;
  rateLabel: string | null;
  color: string;
}

export function DmFunnelOverviewWidget({ data }: DmFunnelOverviewWidgetProps) {
  const steps: FunnelStep[] = [
    { label: 'Mailed', count: data.totalMailed, rate: null, rateLabel: null, color: 'var(--color-main-500)' },
    { label: 'Leads', count: data.leads, rate: data.prospectToLeadRate, rateLabel: 'Mailed → Lead', color: 'var(--color-accent-1-500)' },
    { label: 'Appointments', count: data.appointments, rate: data.leadToAppointmentRate, rateLabel: 'Lead → Appt', color: 'var(--color-accent-2-500)' },
    { label: 'Contracts', count: data.contracts, rate: data.appointmentToContractRate, rateLabel: 'Appt → Contract', color: 'var(--color-accent-3-500)' },
    { label: 'Deals', count: data.deals, rate: data.contractToDealRate, rateLabel: 'Contract → Deal', color: 'var(--color-success-500)' },
  ];

  const maxCount = Math.max(data.totalMailed, 1);

  if (data.totalMailed === 0) {
    return (
      <div className="flex items-center justify-center h-full" style={{ color: 'var(--text-secondary)' }}>
        No conversion data available yet
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-4 overflow-y-auto gap-3">
      {/* Summary banner */}
      <div
        className="flex items-center justify-between gap-4 rounded-lg px-4 py-2 flex-wrap"
        style={{ backgroundColor: 'var(--surface-raised)', border: '1px solid var(--border-subtle)' }}
      >
        <div className="flex items-center gap-1">
          <span className="text-label" style={{ color: 'var(--text-secondary)' }}>Mailed → Deal</span>
          <span className="text-h4 font-semibold" style={{ color: 'var(--color-success-500)' }}>
            {data.overallConversionRate}%
          </span>
        </div>
        <div className="flex items-center gap-4 text-label">
          <span style={{ color: 'var(--text-secondary)' }}>
            Cost: <span className="font-medium" style={{ color: 'var(--text-primary)' }}>${(data.totalCost || 0).toLocaleString()}</span>
          </span>
          <span style={{ color: 'var(--text-secondary)' }}>
            Revenue: <span className="font-medium" style={{ color: (data.totalRevenue || 0) > 0 ? 'var(--color-success-500)' : 'var(--text-primary)' }}>${(data.totalRevenue || 0).toLocaleString()}</span>
          </span>
        </div>
      </div>

      {/* Funnel steps */}
      <div className="flex-1 flex flex-col justify-center gap-2">
        {steps.map((step) => {
          const widthPct = Math.max((step.count / maxCount) * 100, 8);
          return (
            <div key={step.label} className="flex items-center gap-3">
              <div className="w-24 text-right flex-shrink-0">
                <span className="text-label font-medium" style={{ color: 'var(--text-primary)' }}>
                  {step.label}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className="rounded-md h-7 flex items-center px-3 transition-all"
                  style={{
                    width: `${widthPct}%`,
                    backgroundColor: step.color,
                    minWidth: '60px',
                  }}
                >
                  <span className="text-label font-semibold whitespace-nowrap" style={{ color: 'var(--text-inverse)' }}>
                    {step.count.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="w-28 text-left flex-shrink-0">
                {step.rate !== null && (
                  <span className="text-label" style={{ color: 'var(--text-secondary)' }}>
                    {step.rate}%
                    <span className="text-xs ml-1" style={{ color: 'var(--text-tertiary)' }}>
                      {step.rateLabel}
                    </span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
