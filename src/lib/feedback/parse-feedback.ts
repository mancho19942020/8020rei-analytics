/**
 * Admin-side: split a raw feedback `description` into:
 *   - `type` ('bug' | 'suggestion' | 'question' | null)
 *   - `userMessage` (the user's typed text, with the [TYPE] prefix and AI
 *     context block removed)
 *   - `aiContext` (the raw `--- ELEMENT LOCATION ---` / `--- ENVIRONMENT ---`
 *     block, or null if absent)
 *
 * Defensive against legacy / partially-written documents — never throws.
 */

import type { FeedbackType } from './types';

export interface ParsedFeedback {
  type: FeedbackType | null;
  userMessage: string;
  aiContext: string | null;
}

const TYPE_RE = /^\[(BUG|SUGGESTION|QUESTION)\]\s*/i;
const AI_BLOCK_START = '--- ELEMENT LOCATION';

export function parseFeedback(description: string | null | undefined): ParsedFeedback {
  let text = typeof description === 'string' ? description : '';
  let type: FeedbackType | null = null;

  const m = text.match(TYPE_RE);
  if (m) {
    type = m[1].toLowerCase() as FeedbackType;
    text = text.slice(m[0].length);
  }

  const sep = text.indexOf(AI_BLOCK_START);
  if (sep >= 0) {
    return {
      type,
      userMessage: text.slice(0, sep).trim(),
      aiContext: text.slice(sep).trim(),
    };
  }
  return { type, userMessage: text.trim(), aiContext: null };
}
