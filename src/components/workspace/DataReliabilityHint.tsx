/**
 * DataReliabilityHint — one-line "ⓘ Data sources" badge that opens an
 * AxisTooltip with the reliability grade of every key metric on the tab.
 *
 * Placed in the top-right of each DM Campaign tab. Keeps the reliability story
 * one hover away from the reader, without adding a whole widget.
 */

'use client';

import { AxisTooltip } from '@/components/axis';
import { reliabilitySummaryFor, type DmCampaignTab, type ReliabilityGrade } from '@/lib/data-reliability';

interface Props {
  tab: DmCampaignTab;
}

function GradeDot({ grade }: { grade: ReliabilityGrade }) {
  const color = grade === 'HIGH'
    ? 'var(--color-success-500, #22c55e)'
    : grade === 'MEDIUM'
      ? 'var(--color-alert-500, #f59e0b)'
      : 'var(--color-error-500, #ef4444)';
  return (
    <span
      style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: '50%',
        backgroundColor: color,
        marginRight: 6,
        verticalAlign: 'middle',
      }}
    />
  );
}

export function DataReliabilityHint({ tab }: Props) {
  const metrics = reliabilitySummaryFor(tab);
  const content = (
    <div style={{ maxWidth: 440, textAlign: 'left' }}>
      <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 12 }}>
        Data reliability — {metrics.length} key metrics
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {metrics.map(m => (
          <div key={m.metric} style={{ fontSize: 11, lineHeight: 1.4 }}>
            <div>
              <GradeDot grade={m.grade} />
              <strong>{m.metric}</strong>
              <span style={{ opacity: 0.7 }}> — {m.grade}</span>
            </div>
            <div style={{ marginLeft: 14, opacity: 0.75 }}>Source: {m.source}</div>
            {m.caveat && (
              <div style={{ marginLeft: 14, fontStyle: 'italic', opacity: 0.75, marginTop: 2 }}>
                Note: {m.caveat}
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 8, paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.15)', fontSize: 10, opacity: 0.7 }}>
        HIGH = single authoritative source, live updates · MEDIUM = known lag or approximation, surfaced inline · LOW = stored-value drift, reconciliation visible
      </div>
    </div>
  );
  return (
    <AxisTooltip content={content} placement="bottom" maxWidth={460}>
      <span
        className="inline-flex items-center gap-1 text-xs cursor-help"
        style={{ color: 'var(--text-tertiary)' }}
      >
        <span
          style={{
            display: 'inline-block',
            width: 14,
            height: 14,
            borderRadius: '50%',
            border: '1px solid currentColor',
            textAlign: 'center',
            lineHeight: '12px',
            fontSize: 10,
          }}
        >
          ⓘ
        </span>
        Data sources
      </span>
    </AxisTooltip>
  );
}
