/**
 * Client-side service for the feedback admin board.
 *
 * Two responsibilities:
 *   1. Polled read via `subscribeFeedback(callback)` — hits the server-gated
 *      /api/feedback GET endpoint every 5s while the tab is visible.
 *      We poll instead of using client-side Firestore `onSnapshot` so that
 *      admin access is enforced in *one* place (`canAccessFeedbackBoard`
 *      inside /api/feedback) and Firestore client reads stay denied at the
 *      rules layer for defense-in-depth. Updating the admin list requires
 *      editing only `src/lib/access.ts`.
 *   2. Admin mutation calls — wraps `authFetch` against /api/feedback/[id].
 */

'use client';

import { authFetch } from '@/lib/auth-fetch';
import type {
  FeedbackItem,
  FeedbackPriority,
  FeedbackStatus,
} from './types';
import { VALID_STATUSES } from './types';

type SubscribeCallback = (
  items: FeedbackItem[],
  error: Error | null
) => void;

const POLL_INTERVAL_MS = 5000;

async function fetchFeedbackOnce(): Promise<
  { ok: true; items: FeedbackItem[] } | { ok: false; error: Error }
> {
  try {
    const res = await authFetch('/api/feedback', { method: 'GET' });
    let data: { success?: boolean; items?: FeedbackItem[]; error?: string } = {};
    try {
      data = await res.json();
    } catch {
      /* ignore */
    }
    if (!res.ok || !data.success) {
      const message = data.error ?? `Request failed (${res.status})`;
      const err = new Error(message);
      // Tag the error so the UI can render a status-specific message.
      (err as Error & { status?: number }).status = res.status;
      return { ok: false, error: err };
    }
    const items = (data.items ?? []).filter(
      (i) => i && (VALID_STATUSES as readonly string[]).includes(i.status)
    );
    return { ok: true, items };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

export function subscribeFeedback(callback: SubscribeCallback): () => void {
  let cancelled = false;
  let timeout: number | null = null;

  const tick = async () => {
    if (cancelled) return;
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      // Skip while tab is backgrounded — resume on visibilitychange.
      return scheduleNext();
    }
    const result = await fetchFeedbackOnce();
    if (cancelled) return;
    if (result.ok) callback(result.items, null);
    else callback([], result.error);
    scheduleNext();
  };

  const scheduleNext = () => {
    if (cancelled) return;
    timeout = window.setTimeout(tick, POLL_INTERVAL_MS);
  };

  // Re-sync immediately when the tab becomes visible again.
  const handleVisibility = () => {
    if (cancelled) return;
    if (document.visibilityState === 'visible') {
      if (timeout !== null) {
        window.clearTimeout(timeout);
        timeout = null;
      }
      void tick();
    }
  };
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibility);
  }

  // Kick off the first fetch right away.
  void tick();

  return () => {
    cancelled = true;
    if (timeout !== null) {
      window.clearTimeout(timeout);
      timeout = null;
    }
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', handleVisibility);
    }
  };
}

async function patchFeedback(
  id: string,
  body: Record<string, unknown>
): Promise<{ success: true } | { success: false; error: string }> {
  const res = await authFetch(`/api/feedback/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  let data: { success?: boolean; error?: string } = {};
  try {
    data = await res.json();
  } catch {
    /* ignore */
  }
  if (!res.ok || !data.success) {
    return { success: false, error: data.error ?? `Request failed (${res.status})` };
  }
  return { success: true };
}

export function updateFeedbackStatus(id: string, status: FeedbackStatus) {
  return patchFeedback(id, { status });
}

export function updateFeedbackPriority(id: string, priority: FeedbackPriority) {
  return patchFeedback(id, { priority });
}

export function updateAdminResponse(id: string, adminResponse: string | null) {
  return patchFeedback(id, { adminResponse });
}

export function updateFeedbackDescription(id: string, description: string) {
  return patchFeedback(id, { description });
}

export async function deleteFeedback(
  id: string
): Promise<{ success: true } | { success: false; error: string }> {
  const res = await authFetch(`/api/feedback/${id}`, { method: 'DELETE' });
  let data: { success?: boolean; error?: string } = {};
  try {
    data = await res.json();
  } catch {
    /* ignore */
  }
  if (!res.ok || !data.success) {
    return { success: false, error: data.error ?? `Request failed (${res.status})` };
  }
  return { success: true };
}
