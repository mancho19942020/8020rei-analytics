/**
 * Client-side orchestrator for submitting feedback.
 *
 * Combines the captured element context, device snapshot, environment
 * snapshot (with cached visible-values), and the user's typed message into
 * a single payload, then POSTs to /api/feedback.
 *
 * On success, clears the captured context but leaves feedback mode ACTIVE so
 * the user can keep submitting more (per spec D-12).
 */

'use client';

import { authFetch } from '@/lib/auth-fetch';
import {
  clearFeedbackContext,
  getFeedbackContext,
  getLastExtractedValues,
} from './feedback-mode';
import { captureDeviceContext } from './capture-device';
import { captureEnvironmentContext } from './capture-environment';
import { buildAIContext } from './build-ai-context';
import type { FeedbackType } from './types';

export interface SubmitFeedbackParams {
  type: FeedbackType;
  description: string;
}

export type SubmitResult =
  | { success: true; id: string }
  | { success: false; error: string };

export async function submitFeedback(params: SubmitFeedbackParams): Promise<SubmitResult> {
  const ctx = getFeedbackContext();
  if (!ctx) {
    return {
      success: false,
      error: 'No feedback context available. Click a component in feedback mode first.',
    };
  }

  let deviceContext, environmentContext, aiBlock;
  try {
    deviceContext = captureDeviceContext();
    environmentContext = captureEnvironmentContext(getLastExtractedValues());
    aiBlock = buildAIContext(ctx, environmentContext);
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to capture context',
    };
  }

  const fullDescription = `[${params.type.toUpperCase()}] ${params.description.trim()}\n\n${aiBlock}`;

  try {
    const res = await authFetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: fullDescription,
        componentContext: ctx,
        deviceContext,
        environmentContext,
      }),
    });
    let data: { success?: boolean; id?: string; error?: string } = {};
    try {
      data = await res.json();
    } catch {
      /* ignore */
    }

    if (!res.ok || !data.success || !data.id) {
      return { success: false, error: data.error ?? `Request failed (${res.status})` };
    }

    clearFeedbackContext();
    return { success: true, id: data.id };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Network error. Check your connection.',
    };
  }
}
