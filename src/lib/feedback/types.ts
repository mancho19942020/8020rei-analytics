/**
 * Feedback Tool — types and state-machine.
 *
 * Mirrors the spec at personal-documents/Feedback Tool/02-data-model.md.
 * Storage is Firestore collection `feedback_items`. One flat collection, one
 * document per piece of feedback. Real-time admin board via onSnapshot.
 */

import type { Timestamp } from 'firebase/firestore';

export type FeedbackType = 'bug' | 'suggestion' | 'question';
export type FeedbackStatus = 'pending' | 'in-progress' | 'done' | 'dismissed';
export type FeedbackPriority = 'low' | 'medium' | 'high';

export interface FeedbackTargetContext {
  elementType: string;
  label: string;
  sectionName: string | null;
  visibleText: string;
  selectorPath: string;
  pageRoute: string;
  tabName: string | null;
  timestamp: string;
  boundingRect?: { top: number; left: number; width: number; height: number };
  parentHint?: string | null;
}

export interface FeedbackDeviceContext {
  os: string;
  browser: string;
  screenResolution: string;
  viewportSize: string;
  pixelRatio: number;
}

export interface FeedbackEnvironmentContext {
  urlParams: Record<string, string>;
  pageState: 'loading' | 'ready' | 'error' | 'partial';
  loadedSources: string[];
  recentErrors: string[];
  navigationPath: string[];
  visibleValues: Record<string, string>;
}

export interface FeedbackItem {
  id: string;
  authorUid: string;
  authorName: string;
  authorEmail: string;
  status: FeedbackStatus;
  priority: FeedbackPriority;
  description: string;
  componentContext: FeedbackTargetContext;
  deviceContext: FeedbackDeviceContext | null;
  environmentContext: FeedbackEnvironmentContext | null;
  adminResponse: string | null;
  createdAt: Timestamp | Date | { seconds: number; nanoseconds: number } | null;
  updatedAt: Timestamp | Date | { seconds: number; nanoseconds: number } | null;
}

export const VALID_STATUSES: readonly FeedbackStatus[] = [
  'pending',
  'in-progress',
  'done',
  'dismissed',
] as const;

export const VALID_TYPES: readonly FeedbackType[] = [
  'bug',
  'suggestion',
  'question',
] as const;

export const VALID_PRIORITIES: readonly FeedbackPriority[] = [
  'low',
  'medium',
  'high',
] as const;

const VALID_TRANSITIONS: Record<FeedbackStatus, readonly FeedbackStatus[]> = {
  pending: ['in-progress', 'dismissed'],
  'in-progress': ['done', 'dismissed'],
  done: [],
  dismissed: ['done'],
};

export function isValidTransition(
  from: FeedbackStatus,
  to: FeedbackStatus
): boolean {
  if (from === to) return true;
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function isFeedbackStatus(value: unknown): value is FeedbackStatus {
  return typeof value === 'string' && (VALID_STATUSES as readonly string[]).includes(value);
}

export function isFeedbackPriority(value: unknown): value is FeedbackPriority {
  return typeof value === 'string' && (VALID_PRIORITIES as readonly string[]).includes(value);
}

export function isFeedbackType(value: unknown): value is FeedbackType {
  return typeof value === 'string' && (VALID_TYPES as readonly string[]).includes(value);
}
