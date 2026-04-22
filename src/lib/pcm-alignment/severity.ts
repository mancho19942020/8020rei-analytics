/**
 * Severity classifier.
 *
 * Per the alignment contract:
 *   green  <1% drift
 *   yellow 1–5% drift
 *   red    >5% drift, OR sign flip on a margin metric
 *
 * Widget-specific thresholds can override the defaults.
 */

import type { AlignmentSeverity, AlignmentThresholds } from '@/types/pcm-alignment';
import { DEFAULT_THRESHOLDS } from '@/types/pcm-alignment';

export function classifySeverity(
  hub_value: number | null,
  pcm_value: number | null,
  thresholds: AlignmentThresholds = DEFAULT_THRESHOLDS,
): { severity: AlignmentSeverity; delta: number | null; delta_pct: number | null } {
  // No PCM equivalent — this is an Aurora-only metric. Emit `info`; the widget
  // footer will display "Reconciled: N min ago" without a drift icon.
  if (pcm_value === null || hub_value === null) {
    return { severity: 'info', delta: null, delta_pct: null };
  }

  const delta = Math.round((hub_value - pcm_value) * 100) / 100;

  // Avoid divide-by-zero; treat PCM=0 as a special case — if hub also 0 → green,
  // otherwise delta is uncomputable and we flag yellow for manual review.
  if (pcm_value === 0) {
    if (hub_value === 0) {
      return { severity: 'green', delta: 0, delta_pct: 0 };
    }
    return { severity: 'yellow', delta, delta_pct: null };
  }

  const delta_pct = Math.round((delta / pcm_value) * 10000) / 100;
  const absPct = Math.abs(delta_pct);

  // Sign-flip override for margin metrics: if enabled and the signs don't match,
  // go straight to red regardless of magnitude.
  if (thresholds.sign_flip_is_red && Math.sign(hub_value) !== Math.sign(pcm_value)) {
    return { severity: 'red', delta, delta_pct };
  }

  if (absPct < thresholds.yellowPct) return { severity: 'green', delta, delta_pct };
  if (absPct < thresholds.redPct) return { severity: 'yellow', delta, delta_pct };
  return { severity: 'red', delta, delta_pct };
}
