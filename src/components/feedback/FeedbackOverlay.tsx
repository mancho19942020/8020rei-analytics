/**
 * FeedbackOverlay — invisible component that mounts document-level capture-phase
 * listeners while feedback mode is active.
 *
 * Renders no DOM. The single side-effect is:
 *   - on mount: register click (capture phase, Shift-gated), keydown (Esc),
 *     touchstart/touchend/touchcancel (long-press 500ms)
 *   - on unmount: tear them down
 *   - reactive: while active, body class `feedback-mode-active` is applied
 *     (drives the global crosshair cursor in globals.css)
 *
 * Capture-phase is critical — it lets us preventDefault before nested click
 * handlers (drilldowns, links) react. Plain (non-shifted) clicks are ignored
 * so the rest of the app stays usable in feedback mode.
 */

'use client';

import { useEffect, useSyncExternalStore } from 'react';
import {
  buildContextFromElement,
  findMeaningfulElement,
  extractVisibleValues,
} from '@/lib/feedback/capture-element';
import {
  deactivateFeedbackMode,
  getFeedbackModeSnapshot,
  isFeedbackModeActive,
  setFeedbackContext,
  setLastExtractedValues,
  subscribeFeedbackMode,
} from '@/lib/feedback/feedback-mode';

const HIGHLIGHT_DURATION_MS = 2000;
const LONG_PRESS_MS = 500;

let highlightEl: HTMLElement | null = null;
let highlightTimeout: number | null = null;

function showHighlight(el: HTMLElement) {
  clearHighlight();
  highlightEl = el;
  el.classList.add('feedback-highlight-ring');
  highlightTimeout = window.setTimeout(clearHighlight, HIGHLIGHT_DURATION_MS);
}

function clearHighlight() {
  if (highlightEl) {
    highlightEl.classList.remove('feedback-highlight-ring');
    highlightEl = null;
  }
  if (highlightTimeout !== null) {
    window.clearTimeout(highlightTimeout);
    highlightTimeout = null;
  }
}

function captureFromElement(target: HTMLElement) {
  const meaningfulEl = findMeaningfulElement(target);
  const ctx = buildContextFromElement(meaningfulEl);
  setLastExtractedValues(extractVisibleValues(meaningfulEl));
  showHighlight(meaningfulEl);
  setFeedbackContext(ctx);
}

export function FeedbackOverlay() {
  const snap = useSyncExternalStore(
    subscribeFeedbackMode,
    getFeedbackModeSnapshot,
    () => ({ active: false, hasContext: false })
  );

  // Body class — drives the crosshair cursor via globals.css
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (snap.active) {
      document.body.classList.add('feedback-mode-active');
    } else {
      document.body.classList.remove('feedback-mode-active');
      clearHighlight();
    }
    return () => {
      // Defensive: never leave the body class behind on unmount.
      document.body.classList.remove('feedback-mode-active');
      clearHighlight();
    };
  }, [snap.active]);

  // Document listeners — registered once on mount, run while mode is active.
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleClick = (event: MouseEvent) => {
      if (!isFeedbackModeActive()) return;
      // Only Shift+Click triggers capture so plain clicks (drilldowns, links)
      // remain functional while feedback mode is on.
      if (!event.shiftKey) return;
      const target = event.target as HTMLElement | null;
      if (!target) return;
      event.preventDefault();
      event.stopPropagation();
      captureFromElement(target);
    };

    const handleKeydown = (event: KeyboardEvent) => {
      if (!isFeedbackModeActive()) return;
      if (event.key === 'Escape') {
        // Don't exit if a modal is open — the modal itself owns Escape.
        // Heuristic: if a [role="dialog"] is in the DOM, defer to it.
        const dialog = document.querySelector('[role="dialog"][aria-modal="true"]');
        if (dialog) return;
        deactivateFeedbackMode();
      }
    };

    let longPressTimer: number | null = null;
    let longPressTarget: HTMLElement | null = null;
    let longPressEvent: TouchEvent | null = null;

    const handleTouchStart = (event: TouchEvent) => {
      if (!isFeedbackModeActive()) return;
      const target = event.target as HTMLElement | null;
      if (!target) return;
      longPressTarget = target;
      longPressEvent = event;
      longPressTimer = window.setTimeout(() => {
        if (!longPressTarget) return;
        try {
          longPressEvent?.preventDefault();
        } catch {
          /* some browsers throw on stale events */
        }
        captureFromElement(longPressTarget);
        longPressTarget = null;
        longPressEvent = null;
        longPressTimer = null;
      }, LONG_PRESS_MS);
    };

    const handleTouchEnd = () => {
      if (longPressTimer !== null) {
        window.clearTimeout(longPressTimer);
        longPressTimer = null;
      }
      longPressTarget = null;
      longPressEvent = null;
    };

    document.addEventListener('click', handleClick, true);
    document.addEventListener('keydown', handleKeydown);
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('keydown', handleKeydown);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchEnd);
      if (longPressTimer !== null) window.clearTimeout(longPressTimer);
    };
  }, []);

  return null;
}
