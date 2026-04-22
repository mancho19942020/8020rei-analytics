/**
 * useWidgetAlignment — client-side hook for reading a widget's latest
 * PCM alignment state.
 *
 * Fetches from GET /api/pcm-alignment/latest?widget_key=xxx on mount and
 * re-fetches every `refreshMs` (default 60s — the cron writes every 30 min,
 * so 60s keeps the footer fresh without hammering the API).
 *
 * Returns null while loading and on error (the footer fails gracefully —
 * Widget simply shows no alignment chrome).
 */

'use client';

import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/auth-fetch';
import type {
  WidgetAlignmentPayload,
  AlignmentSeverity,
} from '@/types/pcm-alignment';

export interface UseWidgetAlignmentResult {
  payload: WidgetAlignmentPayload | null;
  loading: boolean;
  error: string | null;
  /** Worst severity across all sub_metrics. Quick glance for the footer color. */
  worstSeverity: AlignmentSeverity | null;
  /** Count of sub_metrics at each severity — used for "1 issue", "2 issues" copy. */
  severityCounts: Record<AlignmentSeverity, number>;
}

const SEVERITY_RANK: Record<AlignmentSeverity, number> = { red: 3, yellow: 2, green: 1, info: 0 };

export function useWidgetAlignment(
  widget_key: string | null,
  refreshMs = 60_000,
): UseWidgetAlignmentResult {
  const [payload, setPayload] = useState<WidgetAlignmentPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!widget_key) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchOnce = async () => {
      try {
        const res = await authFetch(
          `/api/pcm-alignment/latest?widget_key=${encodeURIComponent(widget_key)}`,
        );
        const json = await res.json();
        if (cancelled) return;
        if (json.success) {
          setPayload(json.data as WidgetAlignmentPayload);
          setError(null);
        } else {
          setError(json.error ?? 'Failed to load alignment');
        }
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Fetch error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchOnce();
    const t = setInterval(fetchOnce, refreshMs);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [widget_key, refreshMs]);

  // Roll up severity across all sub_metrics × campaign types the widget emits.
  let worstSeverity: AlignmentSeverity | null = null;
  const severityCounts: Record<AlignmentSeverity, number> = { green: 0, yellow: 0, red: 0, info: 0 };

  if (payload) {
    for (const sub of Object.values(payload.sub_metrics)) {
      // Only the `total` row counts for the worst-severity roll-up; .rr / .smartdrop
      // are drill-downs of the same metric, counting them would double-count.
      const doc = sub.total;
      if (!doc) continue;
      severityCounts[doc.severity]++;
      if (!worstSeverity || SEVERITY_RANK[doc.severity] > SEVERITY_RANK[worstSeverity]) {
        worstSeverity = doc.severity;
      }
    }
  }

  return { payload, loading, error, worstSeverity, severityCounts };
}

/** Human-readable "N min ago" from an ISO timestamp. */
export function relativeTime(iso: string | null): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins === 1) return '1 min ago';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours === 1) return '1 hr ago';
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? '1 day ago' : `${days} days ago`;
}
