/**
 * Rapid Response Quality Metrics Widget
 *
 * "Is it working?" — simplified to answer one question at a glance:
 * "how many pieces have we sent, and are they getting delivered?"
 *
 * Layout:
 *   HERO: PCM authoritative lifetime pieces + visible Aurora delta
 *         (matches DM Campaign → Overview → Lifetime pieces card exactly)
 *   3 pills: Delivered (lifetime), Delivery rate, In pipeline
 *
 * Delivery rate source: dm_client_funnel (same as Profitability → Margin
 * summary → cross-tab equality preserved).
 */

'use client';

import { AxisPill } from '@/components/axis';
import type { RrQualityMetrics } from '@/types/rapid-response';

interface RrQualityMetricsWidgetProps {
  data: RrQualityMetrics;
}

function formatK(n: number): string {
  if (n >= 10_000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString();
}

function pillType(value: number, goodThreshold: number, badThreshold: number): 'good' | 'bad' | 'default' {
  if (value >= goodThreshold) return 'good';
  if (value <= badThreshold) return 'bad';
  return 'default';
}

export function RrQualityMetricsWidget({ data }: RrQualityMetricsWidgetProps) {
  // PCM-authoritative headline when the cache is warm. Falls back to Aurora.
  const pcmPieces = data.lifetimePiecesPcm;
  const hasPcm = pcmPieces !== null && pcmPieces !== undefined;
  const headlineNumber = hasPcm ? pcmPieces : data.lifetimeSent;
  const headlineLabel = hasPcm ? 'lifetime mail pieces (PCM)' : 'lifetime mail pieces (Aurora)';

  const delta = data.piecesDelta;
  const deltaPct = data.piecesDeltaPct;
  const showDelta = hasPcm && delta !== null && deltaPct !== null;
  const deltaSign = showDelta && delta! >= 0 ? '+' : '';
  const deltaColor = showDelta && Math.abs(deltaPct!) > 1
    ? 'var(--color-alert-500)'
    : 'var(--text-tertiary)';

  // "In pipeline" = PCM pieces that PCM has recorded but Aurora hasn't caught
  // up on yet. This is the actionable half of the delta — if it trends up over
  // time, the sync is falling behind.
  const inPipeline = showDelta ? Math.max(0, -delta!) : 0;

  return (
    <div className="flex flex-col gap-1 h-full p-3 overflow-hidden">
      {/* Hero — PCM authoritative. Matches Overview → Lifetime pieces card. */}
      <div className="pb-1 mb-1" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="flex items-baseline gap-2">
          <span
            className="text-2xl font-bold tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            {formatK(headlineNumber)}
          </span>
          <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
            {headlineLabel}
          </span>
        </div>
        {showDelta && (
          <div className="text-[11px] mt-0.5" style={{ color: deltaColor }}>
            Aurora: {formatK(data.lifetimeSent)} · Δ {deltaSign}{delta!.toLocaleString()} ({deltaSign}{deltaPct!.toFixed(2)}%)
          </div>
        )}
      </div>
      <AxisPill
        label="Delivery rate"
        value={`${data.deliveryRate30d}%`}
        type={pillType(data.deliveryRate30d, 80, 70)}
        tooltip="Lifetime delivered ÷ lifetime sent from dm_client_funnel. Same source as Profitability → Margin summary. A healthy rate is above 80%."
      />
      <AxisPill
        label="Delivered"
        value={formatK(data.lifetimeDelivered ?? 0)}
        tooltip="Total mail pieces confirmed delivered (lifetime), from dm_client_funnel."
      />
      {showDelta && inPipeline > 0 && (
        <AxisPill
          label="In pipeline"
          value={inPipeline.toLocaleString()}
          tooltip="Mail pieces PCM has recorded (processing + mailing) that Aurora hasn't synced yet. A small, stable number is normal; a growing one means the Aurora → PCM sync is falling behind."
        />
      )}
    </div>
  );
}
