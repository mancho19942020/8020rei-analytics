/**
 * FeedbackModeBanner — top-of-viewport status strip shown only while feedback
 * mode is active. Self-hides when mode is off.
 *
 * Instruction text auto-detects touch (long-press 500ms) vs pointer (Shift+Click).
 *
 * Position: fixed top, z-index above the dashboard chrome but below modals.
 */

'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import {
  deactivateFeedbackMode,
  getFeedbackModeSnapshot,
  subscribeFeedbackMode,
} from '@/lib/feedback/feedback-mode';
import { CloseIcon, MessageSquarePlus } from './feedback-icons';

export function FeedbackModeBanner() {
  const { active } = useSyncExternalStore(
    subscribeFeedbackMode,
    getFeedbackModeSnapshot,
    () => ({ active: false, hasContext: false })
  );
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsTouch(
      'ontouchstart' in window ||
        (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0)
    );
  }, []);

  if (!active) return null;

  const instruction = isTouch
    ? 'Long-press any element'
    : 'Shift + Click any element';

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 left-0 right-0 z-[900] border-b border-stroke bg-main-500/5 dark:bg-main-500/10 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between px-4 py-1.5">
        <div className="flex items-center gap-2 text-label text-content-secondary">
          <MessageSquarePlus className="w-3.5 h-3.5 text-main-500 shrink-0" />
          <span>
            <span className="font-medium text-main-500">Feedback mode</span>
            {' — '}
            {instruction}
          </span>
        </div>
        <button
          type="button"
          onClick={deactivateFeedbackMode}
          className="inline-flex items-center justify-center rounded p-1 text-content-tertiary hover:bg-black/5 dark:hover:bg-white/10 hover:text-content-primary transition-colors"
          aria-label="Exit feedback mode"
        >
          <CloseIcon className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
