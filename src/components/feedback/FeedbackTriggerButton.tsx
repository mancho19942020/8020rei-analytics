/**
 * FeedbackTriggerButton — toggles feedback mode on/off.
 *
 * Lives in the sidebar footer. Honors the sidebar's `collapsed` state:
 * collapsed → icon-only square; expanded → icon + "Feedback" label.
 *
 * Visual state:
 *   off → muted text, ghost background
 *   on  → tinted bg-main-500/10 + text-main-500 (matches the spec's
 *         "selected" treatment)
 *
 * Built without AxisButton so we can fully control the on-state styling
 * without overriding AxisButton's tightly coupled variant classes. Still
 * uses the same Axis tokens.
 */

'use client';

import { useSyncExternalStore } from 'react';
import { AxisTooltip } from '@/components/axis/AxisTooltip';
import {
  getFeedbackModeSnapshot,
  subscribeFeedbackMode,
  toggleFeedbackMode,
} from '@/lib/feedback/feedback-mode';
import { MessageSquarePlus } from './feedback-icons';

interface FeedbackTriggerButtonProps {
  collapsed: boolean;
}

export function FeedbackTriggerButton({ collapsed }: FeedbackTriggerButtonProps) {
  const { active } = useSyncExternalStore(
    subscribeFeedbackMode,
    getFeedbackModeSnapshot,
    () => ({ active: false, hasContext: false })
  );

  const label = active ? 'Exit feedback mode' : 'Activate feedback mode';

  const baseClasses = [
    'inline-flex items-center rounded-md transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main-500 focus-visible:ring-offset-1',
    collapsed ? 'h-9 w-9 justify-center mx-auto' : 'w-full gap-2 px-3 py-2 text-button-regular',
  ].join(' ');

  const stateClasses = active
    ? 'bg-main-500/10 text-main-500 dark:bg-main-500/20 dark:text-main-300'
    : 'text-content-secondary hover:bg-surface-raised hover:text-content-primary';

  const button = (
    <button
      type="button"
      data-feedback-label="action-feedback-toggle"
      data-tour="feedback-button"
      onClick={toggleFeedbackMode}
      aria-pressed={active}
      aria-label={label}
      title={collapsed ? label : undefined}
      className={`${baseClasses} ${stateClasses}`}
    >
      <MessageSquarePlus className={collapsed ? 'w-4 h-4 shrink-0' : 'w-4 h-4 shrink-0'} />
      {!collapsed && <span className="font-medium">Feedback</span>}
    </button>
  );

  if (!collapsed) return button;

  return (
    <AxisTooltip content={label} placement="right">
      {button}
    </AxisTooltip>
  );
}
