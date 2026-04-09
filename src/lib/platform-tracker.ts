/**
 * Platform Tracker
 *
 * Lightweight client-side event tracking for the Metrics Hub itself.
 * Captures navigation, session info, and user actions.
 * Sends events to /api/platform-tracking in batches.
 */

import { authFetch } from '@/lib/auth-fetch';

const BATCH_INTERVAL = 10_000; // Flush every 10 seconds
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 min inactivity = new session

interface TrackingEvent {
  event_type: 'page_view' | 'tab_change' | 'action' | 'session_start' | 'session_end';
  timestamp: string;
  session_id: string;
  user_email: string;
  user_name: string;
  section?: string;
  subsection?: string;
  detail_tab?: string;
  metadata?: Record<string, string>;
}

let eventQueue: TrackingEvent[] = [];
let sessionId = '';
let lastActivity = 0;
let currentUser: { email: string; name: string } | null = null;
let flushTimer: ReturnType<typeof setInterval> | null = null;
let initialized = false;

function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function ensureSession(): string {
  const now = Date.now();
  if (!sessionId || now - lastActivity > SESSION_TIMEOUT) {
    sessionId = generateSessionId();
    // Track session start
    if (currentUser) {
      eventQueue.push({
        event_type: 'session_start',
        timestamp: new Date().toISOString(),
        session_id: sessionId,
        user_email: currentUser.email,
        user_name: currentUser.name,
      });
    }
  }
  lastActivity = now;
  return sessionId;
}

async function flushEvents() {
  if (eventQueue.length === 0) return;

  const batch = [...eventQueue];
  eventQueue = [];

  try {
    await authFetch('/api/platform-tracking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: batch }),
    });
  } catch {
    // Re-queue on failure, but cap size to prevent memory leaks
    if (eventQueue.length < 500) {
      eventQueue.push(...batch);
    }
  }
}

/**
 * Initialize the tracker with the current user.
 * Call once when the user is authenticated.
 */
export function initTracker(email: string, displayName?: string) {
  if (initialized && currentUser?.email === email) return;

  currentUser = { email, name: displayName || email.split('@')[0] };
  initialized = true;

  // Start batch flush timer
  if (!flushTimer) {
    flushTimer = setInterval(flushEvents, BATCH_INTERVAL);
  }

  // Flush on page unload
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      if (currentUser) {
        eventQueue.push({
          event_type: 'session_end',
          timestamp: new Date().toISOString(),
          session_id: sessionId || generateSessionId(),
          user_email: currentUser.email,
          user_name: currentUser.name,
        });
      }
      // Use sendBeacon for reliable delivery on unload
      if (eventQueue.length > 0) {
        navigator.sendBeacon(
          '/api/platform-tracking',
          JSON.stringify({ events: eventQueue })
        );
        eventQueue = [];
      }
    });
  }

  // Track initial session
  ensureSession();
}

/**
 * Track a page/tab navigation event.
 */
export function trackNavigation(section: string, subsection?: string, detailTab?: string) {
  if (!currentUser) return;
  const sid = ensureSession();

  eventQueue.push({
    event_type: 'tab_change',
    timestamp: new Date().toISOString(),
    session_id: sid,
    user_email: currentUser.email,
    user_name: currentUser.name,
    section,
    subsection: subsection || undefined,
    detail_tab: detailTab || undefined,
  });
}

/**
 * Track a user action (export, filter change, etc.).
 */
export function trackAction(action: string, metadata?: Record<string, string>) {
  if (!currentUser) return;
  const sid = ensureSession();

  eventQueue.push({
    event_type: 'action',
    timestamp: new Date().toISOString(),
    session_id: sid,
    user_email: currentUser.email,
    user_name: currentUser.name,
    metadata: { action, ...metadata },
  });
}

/**
 * Stop tracking and clean up.
 */
export function stopTracker() {
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }
  flushEvents();
  initialized = false;
  currentUser = null;
}
