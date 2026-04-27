/**
 * Lightweight toast for feedback success/error messages.
 *
 * Bottom-right corner, slides in, auto-dismisses after `durationMs` (default 3s).
 * Uses Axis tokens (`bg-success-100/text-success-700` etc.) so it matches the
 * rest of the design system without pulling in a new toast library.
 */

'use client';

import { useEffect, useState } from 'react';
import { CheckCircleIcon, CloseIcon } from './feedback-icons';

type ToastVariant = 'success' | 'error';

interface FeedbackInlineToastProps {
  open: boolean;
  variant?: ToastVariant;
  message: string;
  onDismiss: () => void;
  durationMs?: number;
}

export function FeedbackInlineToast({
  open,
  variant = 'success',
  message,
  onDismiss,
  durationMs = 3000,
}: FeedbackInlineToastProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      if (durationMs > 0) {
        const t = window.setTimeout(onDismiss, durationMs);
        return () => window.clearTimeout(t);
      }
    } else {
      const t = window.setTimeout(() => setMounted(false), 200);
      return () => window.clearTimeout(t);
    }
  }, [open, durationMs, onDismiss]);

  if (!mounted && !open) return null;

  const palette =
    variant === 'success'
      ? 'bg-success-100 dark:bg-success-900/40 text-success-700 dark:text-success-300 border-success-300 dark:border-success-700'
      : 'bg-error-100 dark:bg-error-900/40 text-error-700 dark:text-error-300 border-error-300 dark:border-error-700';

  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        'fixed bottom-6 right-6 z-[1100] max-w-sm',
        'flex items-start gap-3 rounded-md border px-4 py-3 shadow-lg',
        'transition-all duration-200',
        open ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none',
        palette,
      ].join(' ')}
    >
      {variant === 'success' ? (
        <CheckCircleIcon className="w-5 h-5 mt-0.5 shrink-0" />
      ) : (
        <span className="w-5 h-5 mt-0.5 shrink-0 inline-flex items-center justify-center font-bold">!</span>
      )}
      <span className="text-body-regular flex-1">{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="shrink-0 rounded p-0.5 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
      >
        <CloseIcon className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
