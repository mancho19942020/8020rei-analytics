/**
 * FeedbackSubmitModal — opens after a Shift+Click captures an element.
 *
 * Built on AxisModal (provides focus trap, escape-to-close, scroll lock,
 * portal). Three-button type selector, char-counted textarea, two
 * sanity-check checkboxes, Cmd/Ctrl+Enter submit shortcut.
 *
 * On success: closes the modal and fires `onSubmitted()` so the parent can
 * surface a toast. Feedback mode stays ACTIVE — user can submit more.
 * On failure: leaves the modal open with an inline AxisCallout error.
 */

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AxisModal } from '@/components/axis/AxisModal';
import { AxisButton } from '@/components/axis/AxisButton';
import { AxisCallout } from '@/components/axis/AxisCallout';
import { AxisCheckbox } from '@/components/axis/AxisCheckbox';
import {
  clearFeedbackContext,
  getFeedbackContext,
} from '@/lib/feedback/feedback-mode';
import { submitFeedback } from '@/lib/feedback/save-feedback';
import type { FeedbackTargetContext, FeedbackType } from '@/lib/feedback/types';

const MIN_CHARS = 15;

const TYPE_OPTIONS: ReadonlyArray<{
  value: FeedbackType;
  label: string;
  hint: string;
}> = [
  { value: 'bug', label: 'Bug', hint: 'Something is broken or wrong' },
  { value: 'suggestion', label: 'Suggestion', hint: 'An improvement idea' },
  { value: 'question', label: 'Question', hint: 'Need clarification' },
];

const PLACEHOLDER_BY_TYPE: Record<FeedbackType, string> = {
  bug: "What's wrong? What did you expect to happen instead?",
  suggestion: 'What would you improve? How should it work?',
  question: "What are you trying to understand? What's unclear?",
};

interface FeedbackSubmitModalProps {
  open: boolean;
  onClose: () => void;
  onSubmitted: () => void;
  onSubmitError?: (message: string) => void;
}

export function FeedbackSubmitModal({
  open,
  onClose,
  onSubmitted,
  onSubmitError,
}: FeedbackSubmitModalProps) {
  // Snapshot the context once when the modal opens, so the displayed label
  // doesn't flicker if the user clicks elsewhere with the modal open.
  const [snapshotCtx, setSnapshotCtx] = useState<FeedbackTargetContext | null>(null);
  const [type, setType] = useState<FeedbackType>('bug');
  const [description, setDescription] = useState('');
  const [checkSpecific, setCheckSpecific] = useState(true);
  const [checkExpected, setCheckExpected] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const charCount = description.trim().length;
  const canSubmit =
    !!snapshotCtx && charCount >= MIN_CHARS && checkSpecific && checkExpected && !submitting;

  // When the modal opens, freeze the context and focus the textarea.
  useEffect(() => {
    if (!open) return;
    setSnapshotCtx(getFeedbackContext());
    setType('bug');
    setDescription('');
    setCheckSpecific(true);
    setCheckExpected(true);
    setError(null);
    setSubmitting(false);
    const t = window.setTimeout(() => textareaRef.current?.focus(), 80);
    return () => window.clearTimeout(t);
  }, [open]);

  const handleClose = () => {
    if (submitting) return;
    clearFeedbackContext();
    onClose();
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    const result = await submitFeedback({ type, description });
    if (result.success) {
      onSubmitted();
      onClose();
    } else {
      setError(result.error);
      setSubmitting(false);
      onSubmitError?.(result.error);
    }
  };

  // Window-scoped Cmd/Ctrl+Enter — fires from inside the textarea since
  // textarea keydowns don't bubble to AxisModal's dialog div.
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        if (canSubmit) {
          void handleSubmit();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, canSubmit, type, description]);

  const placeholder = useMemo(() => PLACEHOLDER_BY_TYPE[type], [type]);
  const remaining = Math.max(0, MIN_CHARS - charCount);

  const locationSummary = snapshotCtx
    ? [snapshotCtx.sectionName, snapshotCtx.pageRoute].filter(Boolean).join(' · ')
    : '';

  return (
    <AxisModal
      open={open}
      onClose={handleClose}
      title="Share Feedback"
      size="md"
      maxHeight="92vh"
      disableBackdropClose={submitting}
      footer={
        <>
          <AxisButton
            variant="outlined"
            size="md"
            onClick={handleClose}
            disabled={submitting}
          >
            Cancel
          </AxisButton>
          <AxisButton
            variant="filled"
            size="md"
            onClick={handleSubmit}
            disabled={!canSubmit}
            loading={submitting}
          >
            {submitting ? 'Submitting…' : 'Submit'}
            {!submitting && canSubmit && (
              <span
                aria-hidden="true"
                className="ml-2 text-[10px] font-mono opacity-80 px-1.5 py-0.5 rounded bg-white/20"
              >
                ⌘↵
              </span>
            )}
          </AxisButton>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {error && (
          <AxisCallout type="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </AxisCallout>
        )}

        {/* You selected */}
        <div className="rounded-md border border-stroke bg-surface-raised px-4 py-3">
          <div className="text-label text-content-tertiary uppercase tracking-wider mb-1">
            You selected
          </div>
          <div className="text-body-large font-semibold text-content-primary truncate">
            {snapshotCtx?.label ? `"${snapshotCtx.label}"` : '(no element captured)'}
          </div>
          {locationSummary && (
            <div className="text-label text-content-secondary mt-0.5 truncate">
              {locationSummary}
            </div>
          )}
        </div>

        {/* Type tri-button */}
        <div>
          <div className="text-label font-medium text-content-primary mb-1.5">
            What type of feedback?
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {TYPE_OPTIONS.map((opt) => {
              const selected = opt.value === type;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setType(opt.value)}
                  aria-pressed={selected}
                  className={[
                    'rounded-md border px-3 py-2 text-left transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main-500 focus-visible:ring-offset-1',
                    selected
                      ? 'border-main-500 bg-main-500/10 text-main-500 dark:bg-main-500/20 dark:text-main-300'
                      : 'border-stroke text-content-secondary hover:border-main-500/50 hover:text-content-primary',
                  ].join(' ')}
                >
                  <div className="text-button-regular font-medium">{opt.label}</div>
                  <div className="text-label opacity-80 mt-0.5">{opt.hint}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Description textarea */}
        <div>
          <label className="block text-label font-medium text-content-primary mb-1.5">
            Describe your feedback
            <span className="text-error-500 ml-0.5" aria-hidden="true">
              *
            </span>
          </label>
          <textarea
            ref={textareaRef}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={placeholder}
            rows={4}
            className="w-full px-4 py-3 text-body-regular bg-surface-base border border-stroke rounded-sm font-sans transition-colors duration-150 focus:outline-none focus:border-main-500 focus:ring-2 focus:ring-main-200 dark:focus:ring-main-900 hover:border-stroke-strong text-content-primary resize-vertical"
          />
          <div className="flex items-center justify-between mt-1.5 text-label">
            <span className={remaining > 0 ? 'text-content-tertiary' : 'text-content-secondary'}>
              {remaining > 0 ? `${remaining} more character${remaining === 1 ? '' : 's'} needed` : 'Looks good ✓'}
            </span>
            <span className="text-content-tertiary tabular-nums">
              {charCount} / {MIN_CHARS}
            </span>
          </div>
        </div>

        {/* Sanity checks */}
        <div className="flex flex-col gap-2">
          <AxisCheckbox
            checked={checkSpecific}
            onChange={setCheckSpecific}
            label='I described the specific issue, not just "fix this"'
          />
          <AxisCheckbox
            checked={checkExpected}
            onChange={setCheckExpected}
            label='I explained what the expected behavior would be'
          />
        </div>
      </div>
    </AxisModal>
  );
}
