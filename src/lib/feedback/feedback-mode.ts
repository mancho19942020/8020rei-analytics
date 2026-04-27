/**
 * Feedback Mode — global session-only state singleton.
 *
 * Holds three slots:
 *   1. `active` flag — is the user currently in feedback mode?
 *   2. `context` — the most recently captured element context (set by the
 *      overlay, cleared after a successful submit).
 *   3. `lastExtractedValues` — KPI numbers near the click site, captured at
 *      click time so the submit-time environment grab can include them.
 *
 * Plus a click-callback registry so the layout can wire "open the modal" once
 * and the overlay never imports React state.
 *
 * Subscribers re-render via the small `subscribe` listener bus — no React
 * state used here, so the singleton can be touched from non-React code (the
 * overlay) and from React (`useFeedbackMode`).
 *
 * Session-only by design — never persisted to localStorage. If the user
 * reloads the page, mode starts off.
 */

import type { FeedbackTargetContext } from './types';

type Listener = () => void;

let active = false;
let context: FeedbackTargetContext | null = null;
let lastExtractedValues: Record<string, string> = {};
let clickCallback: ((ctx: FeedbackTargetContext) => void) | null = null;
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) listener();
}

export function isFeedbackModeActive(): boolean {
  return active;
}

export function activateFeedbackMode(): void {
  if (active) return;
  active = true;
  emit();
}

export function deactivateFeedbackMode(): void {
  if (!active) return;
  active = false;
  context = null;
  emit();
}

export function toggleFeedbackMode(): void {
  if (active) deactivateFeedbackMode();
  else activateFeedbackMode();
}

export function getFeedbackContext(): FeedbackTargetContext | null {
  return context;
}

export function setFeedbackContext(next: FeedbackTargetContext): void {
  context = next;
  emit();
  if (clickCallback) clickCallback(next);
}

export function clearFeedbackContext(): void {
  if (context === null) return;
  context = null;
  emit();
}

export function registerFeedbackClickCallback(
  cb: ((ctx: FeedbackTargetContext) => void) | null
): void {
  clickCallback = cb;
}

export function setLastExtractedValues(values: Record<string, string>): void {
  lastExtractedValues = values ?? {};
}

export function getLastExtractedValues(): Record<string, string> {
  return lastExtractedValues;
}

export function subscribeFeedbackMode(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Snapshot for React's useSyncExternalStore. We return a stable object ref
 * only when the underlying values change, so React doesn't tear or re-render
 * unnecessarily.
 */
let cachedSnapshot = { active: false, hasContext: false };
export function getFeedbackModeSnapshot(): {
  active: boolean;
  hasContext: boolean;
} {
  const next = { active, hasContext: context !== null };
  if (
    cachedSnapshot.active !== next.active ||
    cachedSnapshot.hasContext !== next.hasContext
  ) {
    cachedSnapshot = next;
  }
  return cachedSnapshot;
}
