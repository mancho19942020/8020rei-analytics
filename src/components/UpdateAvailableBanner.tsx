/**
 * UpdateAvailableBanner — floating pill that surfaces "a new version was
 * deployed while you were here, click to reload."
 *
 * Polling design:
 *   - 60-second interval, but only while `document.visibilityState === 'visible'`.
 *   - First poll fires 30s after mount (avoids a stale-CDN flash on initial load).
 *   - Re-syncs immediately when a backgrounded tab becomes visible again
 *     (so a user returning after lunch sees the banner at once instead of
 *     waiting up to 60s).
 *   - Network errors are swallowed — they don't show a banner. Real version
 *     mismatches do.
 *
 * Dismiss behavior:
 *   - Dismissing remembers the SHA the user just dismissed (in sessionStorage).
 *   - The pill stays hidden for that SHA, but reappears on the *next* deploy
 *     (a new SHA breaks the dismissal). This matches Linear / Slack / Notion.
 *
 * Visual design:
 *   - Fixed at top-center, slightly off the chrome.
 *   - Pill-shaped (rounded-full) with primary tint (`bg-main-700`) so it
 *     reads as actionable but not alarmist.
 *   - Slide-down + fade-in entrance.
 *   - Dark-mode aware via Axis tokens.
 *
 * Accessibility:
 *   - `role="status" aria-live="polite"` so screen readers announce the
 *     update without interrupting the user's flow.
 *   - Reload + Dismiss are real <button>s with explicit aria-labels.
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { BUILD_ID } from '@/lib/build-id';
import { CloseIcon } from '@/components/feedback/feedback-icons';

const POLL_INTERVAL_MS = 60_000;
const FIRST_POLL_DELAY_MS = 30_000;
const DISMISSED_SHA_STORAGE_KEY = 'metricsHub.updateBanner.dismissedSha';

interface VersionResponse {
  sha?: string;
  builtAt?: string;
}

function readDismissedSha(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem(DISMISSED_SHA_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeDismissedSha(sha: string): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(DISMISSED_SHA_STORAGE_KEY, sha);
  } catch {
    /* storage unavailable — fine, banner will simply re-show on poll */
  }
}

function RefreshIcon({ className = 'w-4 h-4' }: { className?: string }) {
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
        d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
      />
    </svg>
  );
}

export function UpdateAvailableBanner() {
  const [latestSha, setLatestSha] = useState<string | null>(null);
  const [dismissedSha, setDismissedSha] = useState<string | null>(null);
  const fetchInFlight = useRef(false);

  // Hydrate the dismissed-SHA from sessionStorage on mount (client-only).
  useEffect(() => {
    setDismissedSha(readDismissedSha());
  }, []);

  // Polling loop — visibility-aware.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let cancelled = false;
    let timeoutId: number | null = null;

    const checkVersion = async () => {
      if (cancelled) return;
      if (document.visibilityState !== 'visible') return scheduleNext(POLL_INTERVAL_MS);
      if (fetchInFlight.current) return scheduleNext(POLL_INTERVAL_MS);

      fetchInFlight.current = true;
      try {
        const res = await fetch('/api/version', {
          method: 'GET',
          cache: 'no-store',
          headers: { 'X-Cache-Bust': Date.now().toString() },
        });
        if (!res.ok) return;
        const data = (await res.json()) as VersionResponse;
        if (cancelled) return;
        if (typeof data.sha === 'string' && data.sha.length > 0) {
          setLatestSha(data.sha);
        }
      } catch {
        /* ignore — try again next interval */
      } finally {
        fetchInFlight.current = false;
        scheduleNext(POLL_INTERVAL_MS);
      }
    };

    const scheduleNext = (delay: number) => {
      if (cancelled) return;
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(checkVersion, delay);
    };

    const handleVisibility = () => {
      if (cancelled) return;
      if (document.visibilityState === 'visible') {
        // Re-sync immediately when a backgrounded tab returns.
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
  }, []);

  const isOutdated =
    latestSha !== null && latestSha !== BUILD_ID && latestSha !== dismissedSha;

  // Hide entirely in local development — BUILD_ID === 'dev' produces a lot
  // of noisy mismatches as devs restart the dev server.
  if (BUILD_ID === 'dev') return null;
  if (!isOutdated) return null;

  const handleReload = () => {
    if (typeof window !== 'undefined') window.location.reload();
  };

  const handleDismiss = () => {
    if (latestSha) {
      writeDismissedSha(latestSha);
      setDismissedSha(latestSha);
    }
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        'fixed top-3 left-1/2 -translate-x-1/2 z-[1200]',
        'inline-flex items-center gap-2 pl-4 pr-1.5 py-1.5',
        'rounded-full shadow-lg ring-1 ring-black/5 dark:ring-white/10',
        'bg-main-700 text-white dark:bg-main-500',
        'animate-[updatePillIn_220ms_ease-out_both]',
      ].join(' ')}
      style={
        {
          // Inline keyframes injected once; @keyframes used inside a Tailwind
          // arbitrary value won't compile. Using a unique class so it doesn't
          // collide with anything else.
          ['--update-pill-anim' as string]: 'updatePillIn 220ms ease-out both',
        } as React.CSSProperties
      }
    >
      <RefreshIcon className="w-4 h-4 shrink-0" />
      <span className="text-button-small font-medium whitespace-nowrap">
        New version available
      </span>
      <button
        type="button"
        onClick={handleReload}
        className="rounded-full bg-white/15 hover:bg-white/25 active:bg-white/35 transition-colors px-3 py-1 text-button-small font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        Reload
      </button>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss"
        className="inline-flex items-center justify-center w-7 h-7 rounded-full hover:bg-white/15 active:bg-white/25 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <CloseIcon className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
