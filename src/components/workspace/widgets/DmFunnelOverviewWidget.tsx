/**
 * DM Conversion Funnel Overview Widget
 *
 * Flowing SVG stream visualization: Mailed → Lead → Appointment → Contract → Deal
 * Shows counts, conversion rates with labels, cost and revenue.
 */

'use client';

import { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import type { DmFunnelOverview } from '@/types/dm-conversions';
import { DmPropertyDrilldownModal } from './DmPropertyDrilldownModal';
import type { DrilldownStatus } from './DmPropertyDrilldownModal';

interface DmFunnelOverviewWidgetProps {
  data: DmFunnelOverview;
  /** Current domain filter (undefined = all clients) */
  selectedDomain?: string;
}

interface FunnelStage {
  label: string;
  count: number;
  rate: number | null;
  rateLabel: string | null;
  color: string;
  drilldownStatus: DrilldownStatus;
}

const STAGE_COLORS = [
  'var(--color-main-500)',
  'var(--color-accent-1-500)',
  'var(--color-accent-2-500)',
  'var(--color-accent-3-500)',
  'var(--color-success-500)',
] as const;

function resolveColor(el: HTMLElement, cssVar: string): string {
  const temp = document.createElement('div');
  temp.style.color = cssVar;
  el.appendChild(temp);
  const resolved = getComputedStyle(temp).color;
  temp.remove();
  return resolved;
}

export function DmFunnelOverviewWidget({ data, selectedDomain }: DmFunnelOverviewWidgetProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [drilldown, setDrilldown] = useState<{
    open: boolean;
    status: DrilldownStatus;
    count: number;
  }>({ open: false, status: 'mailed', count: 0 });

  const openDrilldown = useCallback((status: DrilldownStatus, count: number) => {
    if (count === 0) return;
    setDrilldown({ open: true, status, count });
  }, []);

  const closeDrilldown = useCallback(() => {
    setDrilldown(prev => ({ ...prev, open: false }));
  }, []);

  const stages: FunnelStage[] = useMemo(() => [
    { label: 'Mailed', count: data.totalMailed, rate: null, rateLabel: null, color: STAGE_COLORS[0], drilldownStatus: 'mailed' },
    { label: 'Leads', count: data.leads, rate: data.prospectToLeadRate, rateLabel: 'Mailed \u2192 Lead', color: STAGE_COLORS[1], drilldownStatus: 'lead' },
    { label: 'Appointments', count: data.appointments, rate: data.leadToAppointmentRate, rateLabel: 'Lead \u2192 Appt', color: STAGE_COLORS[2], drilldownStatus: 'appointment' },
    { label: 'Contracts', count: data.contracts, rate: data.appointmentToContractRate, rateLabel: 'Appt \u2192 Contract', color: STAGE_COLORS[3], drilldownStatus: 'contract' },
    { label: 'Deals', count: data.deals, rate: data.contractToDealRate, rateLabel: 'Contract \u2192 Deal', color: STAGE_COLORS[4], drilldownStatus: 'deal' },
  ], [data]);

  useEffect(() => {
    const svg = svgRef.current;
    const container = containerRef.current;
    if (!svg || !container) return;

    function draw() {
      if (!svg || !container) return;
      const W = container.offsetWidth;
      const H = container.offsetHeight;
      if (W === 0 || H === 0) return;

      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

      const counts = stages.map(s => s.count);
      const resolvedColors = stages.map(s => resolveColor(container, s.color));
      const maxCount = Math.max(...counts, 1);
      const centerY = H / 2;
      const maxHalf = H * 0.42;
      const minHalf = H * 0.04;
      const stageW = W / stages.length;

      const heights = counts.map(c => {
        const ratio = c / maxCount;
        return Math.max(minHalf, maxHalf * Math.sqrt(ratio));
      });

      let content = '<defs>';
      for (let i = 0; i < stages.length; i++) {
        const c1 = resolvedColors[i];
        const c2 = i < stages.length - 1 ? resolvedColors[i + 1] : resolvedColors[i];
        content += `<linearGradient id="fg-${i}" x1="0%" x2="100%">
          <stop offset="0%" stop-color="${c1}" stop-opacity="0.30"/>
          <stop offset="100%" stop-color="${c2}" stop-opacity="0.20"/>
        </linearGradient>`;
      }
      content += '</defs>';

      for (let i = 0; i < stages.length; i++) {
        const x1 = i * stageW;
        const x2 = (i + 1) * stageW;
        const h1 = heights[i];
        const h2 = i < stages.length - 1 ? heights[i + 1] : heights[i];
        const cp = stageW * 0.4;
        const c = resolvedColors[i];

        content += `<path d="M ${x1} ${centerY - h1} C ${x1 + cp} ${centerY - h1}, ${x2 - cp} ${centerY - h2}, ${x2} ${centerY - h2} L ${x2} ${centerY + h2} C ${x2 - cp} ${centerY + h2}, ${x1 + cp} ${centerY + h1}, ${x1} ${centerY + h1} Z" fill="url(#fg-${i})"/>`;
        content += `<path d="M ${x1} ${centerY - h1} C ${x1 + cp} ${centerY - h1}, ${x2 - cp} ${centerY - h2}, ${x2} ${centerY - h2}" fill="none" stroke="${c}" stroke-width="1.5" stroke-opacity="0.25"/>`;
        content += `<path d="M ${x1} ${centerY + h1} C ${x1 + cp} ${centerY + h1}, ${x2 - cp} ${centerY + h2}, ${x2} ${centerY + h2}" fill="none" stroke="${c}" stroke-width="1.5" stroke-opacity="0.25"/>`;

        if (i > 0) {
          content += `<line x1="${x1}" y1="0" x2="${x1}" y2="${H}" stroke="var(--border-subtle)" stroke-opacity="0.3" stroke-width="1"/>`;
        }
      }

      svg.innerHTML = content;
    }

    draw();

    const ro = new ResizeObserver(() => draw());
    ro.observe(container);
    return () => ro.disconnect();
  }, [stages]);

  const hasAnyData = data.totalMailed > 0 || data.leads > 0 || data.appointments > 0
    || data.contracts > 0 || data.deals > 0;

  if (!hasAnyData) {
    return (
      <div className="flex items-center justify-center h-full" style={{ color: 'var(--text-secondary)' }}>
        No conversion data available yet
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Summary banner */}
      <div
        className="flex items-center justify-between gap-4 mx-4 mt-4 mb-2 rounded-lg px-4 py-2 flex-wrap"
        style={{ backgroundColor: 'var(--surface-raised)', border: '1px solid var(--border-subtle)' }}
      >
        <div className="flex items-center gap-1.5">
          <span className="text-label" style={{ color: 'var(--text-secondary)' }}>Mailed → Deal</span>
          <span className="text-h4 font-semibold" style={{ color: 'var(--color-success-500)' }}>
            {data.overallConversionRate}%
          </span>
        </div>
        <div className="flex items-center gap-4 text-label">
          <span style={{ color: 'var(--text-secondary)' }}>
            Cost: <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
              ${(data.totalCost || 0).toLocaleString()}
            </span>
          </span>
          <span style={{ color: 'var(--text-secondary)' }}>
            Revenue: <span className="font-medium" style={{ color: (data.totalRevenue || 0) > 0 ? 'var(--color-success-500)' : 'var(--text-primary)' }}>
              ${(data.totalRevenue || 0).toLocaleString()}
            </span>
          </span>
        </div>
      </div>

      {/* Flowing funnel */}
      <div
        ref={containerRef}
        className="flex-1 relative min-h-0"
        style={{ minHeight: '120px' }}
      >
        <svg
          ref={svgRef}
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="none"
        />

        {/* Stage overlays — count + label, counts are clickable */}
        <div className="absolute inset-0 flex">
          {stages.map((stage) => (
            <div
              key={stage.label}
              className="flex-1 flex flex-col items-center justify-center relative z-10 px-2"
            >
              <button
                type="button"
                className="bg-transparent border-0 p-0 cursor-pointer hover:opacity-80 transition-opacity"
                style={{ color: stage.color, textShadow: '0 1px 4px rgba(0,0,0,0.15)' }}
                onClick={() => openDrilldown(stage.drilldownStatus, stage.count)}
                title={stage.count > 0 ? `View ${stage.count} ${stage.label.toLowerCase()}` : undefined}
                disabled={stage.count === 0}
              >
                <span className="text-2xl font-extrabold tracking-tight">
                  {stage.count.toLocaleString()}
                </span>
              </button>
              <span
                className="text-xs font-semibold uppercase tracking-wide mt-0.5"
                style={{ color: 'var(--text-secondary)' }}
              >
                {stage.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Conversion rate pills — aligned under each stage */}
      <div className="flex px-0 pb-3 pt-1">
        {stages.map((stage) => (
          <div key={stage.label} className="flex-1 flex justify-center">
            {stage.rate !== null && (
              <span
                className="text-[11px] font-medium px-2.5 py-1 rounded-full whitespace-nowrap"
                style={{
                  backgroundColor: 'var(--surface-raised)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                {stage.rate}%{' '}
                <span style={{ color: 'var(--text-tertiary)' }}>{stage.rateLabel}</span>
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Property drilldown modal — domain is required, show hint if all-clients view */}
      {selectedDomain ? (
        <DmPropertyDrilldownModal
          open={drilldown.open}
          onClose={closeDrilldown}
          domain={selectedDomain}
          status={drilldown.status}
          expectedCount={drilldown.count}
        />
      ) : (
        <DmPropertyDrilldownModal
          open={drilldown.open}
          onClose={closeDrilldown}
          domain="_all"
          status={drilldown.status}
          expectedCount={drilldown.count}
        />
      )}
    </div>
  );
}
