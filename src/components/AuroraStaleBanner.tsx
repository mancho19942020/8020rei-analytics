/**
 * AuroraStaleBanner — floating pill that surfaces "the data underneath this
 * dashboard is older than the documented Aurora-sync cadence."
 *
 * Why this exists:
 *   The monolith→Aurora cron occasionally drifts (Horizon worker dies, cron
 *   skips, dispatch errors silently). When it does, every metrics-hub page
 *   continues rendering pre-stale numbers as if they were current — the user
 *   has no signal that the dashboard is lying. This banner makes that signal
 *   loud and present at the top of every page until sync recovers.
 *
 * Polling design (mirrors UpdateAvailableBanner):
 *   - 90s interval, but only while `document.visibilityState === 'visible'`.
 *   - First poll fires 5s after mount (so a user who opens during an outage
 *     sees the banner promptly without waiting a full poll cycle).
 *   - Re-syncs immediately when a backgrounded tab becomes visible again.
 *   - Network errors are swallowed; the banner only renders on a real stale
 *     signal from the server.
 *
 * Visual:
 *   - Top-center pill, similar to the update banner but distinguishable:
 *     amber for warning, red for critical.
 *   - Non-dismissible — staleness affects truthfulness, not the user's
 *     attention. It clears the moment sync recovers.
 *   - role="status" aria-live="polite" so screen readers announce without
 *     interrupting.
 *
 * Thresholds:
 *   Two distinct cadences encoded server-side at /api/data-freshness:
 *     • rr_campaign_snapshots — hourly: warn ≥3h, critical ≥6h.
 *     • dm_client_funnel — daily 02:00 UTC: warn ≥27h, critical ≥36h.
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/firebase/AuthContext';
import { canAccessAuroraStaleBanner } from '@/lib/access';

const POLL_INTERVAL_MS = 90_000;
const FIRST_POLL_DELAY_MS = 5_000;
const DISMISSED_KEY = 'metricsHub.auroraStaleBanner.dismissedTone';

function readDismissedTone(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem(DISMISSED_KEY);
  } catch {
    return null;
  }
}

function writeDismissedTone(tone: string): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(DISMISSED_KEY, tone);
  } catch {
    /* storage unavailable — banner will simply re-show on next poll */
  }
}

function CloseIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2.4}
      stroke="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}

interface FreshnessResponse {
  snapshotAgeHours: number | null;
  funnelAgeHours: number | null;
  snapshotStale: boolean;
  funnelStale: boolean;
  snapshotCritical: boolean;
  funnelCritical: boolean;
  isStale: boolean;
  isCritical: boolean;
}

function formatAge(hours: number | null): string {
  if (hours == null) return 'unknown';
  if (hours < 1) return `${Math.round(hours * 60)}min`;
  if (hours < 24) return `${hours.toFixed(1)}h`;
  return `${(hours / 24).toFixed(1)}d`;
}

function buildMessage(state: FreshnessResponse): string {
  const parts: string[] = [];
  if (state.snapshotStale) {
    parts.push(`hourly snapshots ${formatAge(state.snapshotAgeHours)} behind`);
  }
  if (state.funnelStale) {
    parts.push(`daily funnel ${formatAge(state.funnelAgeHours)} behind`);
  }
  return parts.length === 0 ? 'sync is delayed' : parts.join(' · ');
}

function WarnIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
      />
    </svg>
  );
}

export function AuroraStaleBanner() {
  const { user } = useAuth();
  const [state, setState] = useState<FreshnessResponse | null>(null);
  const [dismissedTone, setDismissedTone] = useState<string | null>(null);
  const fetchInFlight = useRef(false);

  // Hydrate the dismissed-tone from sessionStorage on mount (client-only).
  useEffect(() => {
    setDismissedTone(readDismissedTone());
  }, []);

  // Only poll if this user is allowed to see the banner. Skipping the poll
  // for unauthorized users avoids a useless backend hit per page load.
  const canSeeBanner = canAccessAuroraStaleBanner(user?.email);

  useEffect(() => {
    if (!canSeeBanner) return;
    if (typeof window === 'undefined') return;

    let cancelled = false;
    let timeoutId: number | null = null;

    const checkFreshness = async () => {
      if (cancelled) return;
      if (document.visibilityState !== 'visible') return scheduleNext(POLL_INTERVAL_MS);
      if (fetchInFlight.current) return scheduleNext(POLL_INTERVAL_MS);

      fetchInFlight.current = true;
      try {
        const res = await fetch('/api/data-freshness', {
          method: 'GET',
          cache: 'no-store',
          headers: { 'X-Cache-Bust': Date.now().toString() },
        });
        if (!res.ok && res.status !== 500) return;
        const data = (await res.json()) as FreshnessResponse;
        if (cancelled) return;
        setState(data);
      } catch {
        /* swallow — try again next interval */
      } finally {
        fetchInFlight.current = false;
        scheduleNext(POLL_INTERVAL_MS);
      }
    };

    const scheduleNext = (delay: number) => {
      if (cancelled) return;
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(checkFreshness, delay);
    };

    const handleVisibility = () => {
      if (cancelled) return;
      if (document.visibilityState === 'visible') {
        scheduleNext(0);
      }
    };

    scheduleNext(FIRST_POLL_DELAY_MS);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      cancelled = true;
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [canSeeBanner]);

  if (!canSeeBanner) return null;
  if (!state || !state.isStale) return null;

  const tone = state.isCritical ? 'critical' : 'warning';

  // Dismissal is per-tone. Click X while warning → hidden until tone changes.
  // If sync gets worse (warning → critical), banner reappears to flag the
  // escalation; if it recovers, banner naturally hides via isStale=false.
  if (dismissedTone === tone) return null;

  const message = buildMessage(state);
  const bgClass = tone === 'critical'
    ? 'bg-red-700 dark:bg-red-800'
    : 'bg-amber-600 dark:bg-amber-700';

  const handleDismiss = () => {
    writeDismissedTone(tone);
    setDismissedTone(tone);
  };

  return (
    <div className="fixed inset-x-0 top-3 z-[1199] flex justify-center pointer-events-none">
      <div
        role="status"
        aria-live="polite"
        className={[
          'pointer-events-auto',
          'inline-flex items-center gap-2 pl-4 pr-1.5 py-1.5',
          'rounded-full shadow-lg ring-1 ring-white/40 dark:ring-white/30',
          bgClass,
          'text-white',
          'animate-[updatePillIn_220ms_ease-out_both]',
        ].join(' ')}
      >
        <WarnIcon className="w-4 h-4 shrink-0" />
        <span className="text-button-small font-medium whitespace-nowrap">
          {tone === 'critical' ? 'Data is significantly stale' : 'Data may be outdated'}
          {' — '}
          {message}
        </span>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="inline-flex items-center justify-center w-7 h-7 rounded-full hover:bg-white/15 active:bg-white/25 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <CloseIcon className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
