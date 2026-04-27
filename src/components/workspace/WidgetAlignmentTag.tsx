/**
 * WidgetAlignmentTag
 *
 * Pill-sized tag rendered in the widget header action group, alongside the
 * existing time-scope tags ("All time" / "Date range" / "Last 30 days").
 *
 * Visual states:
 *   - No data yet        → neutral pill, "Awaiting reconcile"
 *   - All green/info     → neutral pill, "Reconciled 12m ago"
 *   - Any yellow drift   → alert-colored pill, same label
 *   - Any red drift      → error-colored pill, same label
 *
 * Hovering the tag immediately shows a tooltip with the per-sub-metric drift
 * breakdown (Hub vs PCM vs Δ).
 *
 * Reads from GET /api/pcm-alignment/latest via useWidgetAlignment hook.
 * Fails silently — on error the tag simply does not render.
 */

'use client';

import { AxisTag, AxisTooltip } from '@/components/axis';
import { useWidgetAlignment, relativeTime } from '@/lib/pcm-alignment/useWidgetAlignment';
import type { AlignmentDoc, AlignmentSeverity } from '@/types/pcm-alignment';

interface Props {
  widgetKey: string;
}

type TagColor = 'neutral' | 'alert' | 'error';

export function WidgetAlignmentTag({ widgetKey }: Props) {
  const { payload, loading, error, worstSeverity, severityCounts } = useWidgetAlignment(widgetKey);

  // Error: render nothing (dashboard keeps working; the tag is supplementary)
  if (error) return null;

  // Loading with no cached payload yet: render nothing to avoid a visible pop
  if (loading && !payload) return null;

  const hasData = !!payload?.last_computed_at;
  const when = hasData ? relativeTime(payload!.last_computed_at) : null;

  const color: TagColor =
    worstSeverity === 'red' ? 'error'
    : worstSeverity === 'yellow' ? 'alert'
    : 'neutral';

  const label = hasData ? `Reconciled ${compactTime(when!)}` : 'Awaiting reconcile';

  const tooltipContent = hasData
    ? <TagTooltip payload={payload!} worstSeverity={worstSeverity} severityCounts={severityCounts} />
    : <span>This widget has not been reconciled against PCM yet. The reconciler is scheduled every 30 min (best-effort) and will pick up this widget on its next pass.</span>;

  const tooltipTitle = hasData && worstSeverity === 'red'
    ? `${severityCounts.red} metric${severityCounts.red > 1 ? 's' : ''} out of alignment`
    : hasData && worstSeverity === 'yellow'
      ? `${severityCounts.yellow} metric${severityCounts.yellow > 1 ? 's' : ''} drifting`
      : hasData ? 'Aligned with PCM' : undefined;

  return (
    <AxisTooltip
      title={tooltipTitle}
      content={tooltipContent}
      placement="bottom"
      maxWidth={380}
    >
      <span className="flex-shrink-0 cursor-help">
        <AxisTag color={color} size="sm" dot={worstSeverity === 'red' || worstSeverity === 'yellow'}>
          {label}
        </AxisTag>
      </span>
    </AxisTooltip>
  );
}

/** Compact time format for the pill: "12m ago", "2h ago", "3d ago". */
function compactTime(longForm: string): string {
  return longForm
    .replace(' min ago', 'm ago')
    .replace(' hr ago', 'h ago')
    .replace(' days ago', 'd ago')
    .replace(' day ago', 'd ago');
}

interface TagTooltipProps {
  payload: NonNullable<ReturnType<typeof useWidgetAlignment>['payload']>;
  worstSeverity: AlignmentSeverity | null;
  severityCounts: Record<AlignmentSeverity, number>;
}

function TagTooltip({ payload, worstSeverity }: TagTooltipProps) {
  const drifted: Array<{ label: string; doc: AlignmentDoc }> = [];
  for (const [sub, combo] of Object.entries(payload.sub_metrics)) {
    const doc = combo.total;
    if (!doc) continue;
    if (doc.severity !== 'yellow' && doc.severity !== 'red') continue;
    drifted.push({ label: sub === '_root' ? payload.widget_key : sub, doc });
  }

  // Green / info: celebrate alignment. Also show last-check timestamp context.
  if (drifted.length === 0) {
    return (
      <div className="space-y-1">
        <div>All metrics on this widget are within tolerance of PCM.</div>
        <div className="text-[11px] opacity-70">
          Last checked {relativeTime(payload.last_computed_at)}. Reconciler is scheduled every 30 min (best-effort cron — actual cadence may lag).
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <ul className="space-y-1">
        {drifted.map(({ label, doc }) => (
          <li key={label} className="flex flex-col">
            <span className="font-medium">{humanize(label)}</span>
            <span className="text-[11px] opacity-80">
              Hub: {fmt(doc.hub_value)} · PCM: {fmt(doc.pcm_value)}
              {doc.delta_pct !== null && (
                <> · Δ {doc.delta_pct > 0 ? '+' : ''}{doc.delta_pct.toFixed(1)}%</>
              )}
            </span>
          </li>
        ))}
      </ul>
      <div className="text-[11px] opacity-70 pt-1 border-t border-white/10">
        {worstSeverity === 'red'
          ? 'Red: drift exceeds our tolerance. The platform has flagged this for follow-up.'
          : 'Yellow: minor drift within our tolerance. Watching.'}
      </div>
    </div>
  );
}

function fmt(v: number | null): string {
  if (v === null) return '—';
  if (Math.abs(v) >= 1000) return v.toLocaleString(undefined, { maximumFractionDigits: 0 });
  return v.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function humanize(key: string): string {
  return key.replace(/[-_.]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
