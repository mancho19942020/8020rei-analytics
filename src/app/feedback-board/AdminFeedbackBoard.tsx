/**
 * AdminFeedbackBoard — the actual admin board UI.
 *
 * Real-time list (onSnapshot) of feedback items with status tabs, person
 * filter, multi-select, "Copy as Prompt", "Copy All Pending", inline status
 * + priority pickers, admin response, and edit-description.
 *
 * Strict reuse of Axis primitives:
 *   AxisNavigationTab, AxisSelect, AxisCard, AxisTag, AxisButton,
 *   AxisCheckbox, AxisCallout, AxisSkeleton.
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AxisNavigationTab, AxisNavigationTabItem } from '@/components/axis/AxisNavigationTab';
import { AxisSelect, AxisSelectOption } from '@/components/axis/AxisSelect';
import { AxisCard } from '@/components/axis/AxisCard';
import { AxisTag } from '@/components/axis/AxisTag';
import { AxisButton } from '@/components/axis/AxisButton';
import { AxisCheckbox } from '@/components/axis/AxisCheckbox';
import { AxisCallout } from '@/components/axis/AxisCallout';
import { AxisSkeleton } from '@/components/axis/AxisSkeleton';
import { FeedbackInlineToast } from '@/components/feedback/FeedbackInlineToast';
import {
  CopyIcon,
  CloseIcon,
  ChevronDownIcon,
  PencilIcon,
  TrashIcon,
} from '@/components/feedback/feedback-icons';
import { subscribeFeedback, deleteFeedback, updateAdminResponse, updateFeedbackDescription, updateFeedbackPriority, updateFeedbackStatus } from '@/lib/feedback/feedback-service';
import { buildPrompt } from '@/lib/feedback/build-prompt';
import { parseFeedback } from '@/lib/feedback/parse-feedback';
import {
  isValidTransition,
  type FeedbackItem,
  type FeedbackPriority,
  type FeedbackStatus,
  type FeedbackType,
  VALID_PRIORITIES,
  VALID_STATUSES,
} from '@/lib/feedback/types';

interface AdminFeedbackBoardProps {
  // Reserved — admin email is currently unused in the UI but available for
  // future per-admin features (e.g. "claim this item" attribution).
  currentUserEmail?: string;
}

const STATUS_TABS_BASE: ReadonlyArray<{ id: FeedbackStatus; name: string }> = [
  { id: 'pending', name: 'Pending' },
  { id: 'in-progress', name: 'In Progress' },
  { id: 'done', name: 'Done' },
  { id: 'dismissed', name: 'Dismissed' },
];

const STATUS_OPTIONS: AxisSelectOption[] = VALID_STATUSES.map((s) => ({
  value: s,
  label: STATUS_TABS_BASE.find((t) => t.id === s)?.name ?? s,
}));

const PRIORITY_OPTIONS: AxisSelectOption[] = VALID_PRIORITIES.map((p) => ({
  value: p,
  label: p.charAt(0).toUpperCase() + p.slice(1),
}));

function tagColorForType(type: FeedbackType | null) {
  if (type === 'bug') return 'error' as const;
  if (type === 'suggestion') return 'alert' as const;
  if (type === 'question') return 'info' as const;
  return 'neutral' as const;
}

function tagColorForStatus(status: FeedbackStatus) {
  if (status === 'pending') return 'alert' as const;
  if (status === 'in-progress') return 'info' as const;
  if (status === 'done') return 'success' as const;
  return 'neutral' as const;
}

function tagColorForPriority(priority: FeedbackPriority) {
  if (priority === 'high') return 'error' as const;
  if (priority === 'medium') return 'info' as const;
  return 'neutral' as const;
}

function getInitials(name: string | null | undefined): string {
  if (typeof name !== 'string' || !name.trim()) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function relativeTime(value: FeedbackItem['createdAt']): string {
  if (!value) return '';
  let date: Date | null = null;
  if (value instanceof Date) date = value;
  else if (typeof value === 'object' && value !== null && 'seconds' in value) {
    date = new Date((value as { seconds: number }).seconds * 1000);
  } else if (typeof value === 'object' && value !== null && 'toDate' in value) {
    try {
      date = (value as { toDate: () => Date }).toDate();
    } catch {
      date = null;
    }
  }
  if (!date) return '';
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

export function AdminFeedbackBoard(_props: AdminFeedbackBoardProps) {
  const router = useRouter();
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorIsAuth, setErrorIsAuth] = useState(false);
  const [activeTab, setActiveTab] = useState<FeedbackStatus>('pending');
  const [selectedPerson, setSelectedPerson] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [contextExpanded, setContextExpanded] = useState<Record<string, boolean>>({});
  const [deviceExpanded, setDeviceExpanded] = useState<Record<string, boolean>>({});
  const [responseDraft, setResponseDraft] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<Record<string, string | null>>({});
  const [responseOpen, setResponseOpen] = useState<Record<string, boolean>>({});
  const [showCopiedPrompt, setShowCopiedPrompt] = useState<{
    open: boolean;
    ids: string[];
  }>({ open: false, ids: [] });
  const [toast, setToast] = useState<{
    open: boolean;
    variant: 'success' | 'error';
    message: string;
  }>({ open: false, variant: 'success', message: '' });

  // Polled subscription (5s while visible). The page-level email gate is
  // the primary access control; a 403 here would only happen if the email
  // list became stale between renders. Surface that distinctly so the admin
  // sees something actionable instead of a generic "permissions" error.
  useEffect(() => {
    const unsub = subscribeFeedback((next, err) => {
      if (err) {
        const status = (err as Error & { status?: number }).status;
        setErrorIsAuth(status === 401 || status === 403);
        setError(
          status === 401 || status === 403
            ? 'Your account is not in the Feedback Inbox admin list. Add your email to FEEDBACK_BOARD_AUTHORIZED_EMAILS in src/lib/access.ts and redeploy.'
            : err.message || 'Could not reach the feedback API.'
        );
        setLoading(false);
        return;
      }
      setItems(next);
      setError(null);
      setErrorIsAuth(false);
      setLoading(false);
    });
    return unsub;
  }, []);

  // Counts per tab
  const counts = useMemo(() => {
    const out: Record<FeedbackStatus, number> = {
      pending: 0,
      'in-progress': 0,
      done: 0,
      dismissed: 0,
    };
    for (const item of items) {
      if (item.status in out) out[item.status]++;
    }
    return out;
  }, [items]);

  const tabs: AxisNavigationTabItem[] = STATUS_TABS_BASE.map((t) => ({
    id: t.id,
    name: t.name,
    badge: counts[t.id] || undefined,
  }));

  // Unique authors for the person filter
  const uniqueAuthors = useMemo(
    () =>
      Array.from(new Set(items.map((i) => i.authorName).filter((n): n is string => !!n))).sort(),
    [items]
  );

  const personOptions: AxisSelectOption[] = useMemo(
    () => [
      { value: '', label: 'All people' },
      ...uniqueAuthors.map((a) => ({ value: a, label: a })),
    ],
    [uniqueAuthors]
  );

  // Filtered list for the active tab + person filter
  const filteredItems = useMemo(
    () =>
      items.filter(
        (i) =>
          i.status === activeTab && (!selectedPerson || i.authorName === selectedPerson)
      ),
    [items, activeTab, selectedPerson]
  );

  const allFilteredSelected =
    filteredItems.length > 0 && filteredItems.every((i) => selectedIds.has(i.id));

  const toggleSelectAllFiltered = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        for (const i of filteredItems) next.delete(i.id);
      } else {
        for (const i of filteredItems) next.add(i.id);
      }
      return next;
    });
  };

  const toggleItem = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const clearSelection = () => setSelectedIds(new Set());

  // ── Actions ──
  const showToast = (variant: 'success' | 'error', message: string) =>
    setToast({ open: true, variant, message });

  const handleStatusChange = async (item: FeedbackItem, next: FeedbackStatus) => {
    if (next === item.status) return;
    if (!isValidTransition(item.status, next)) {
      showToast('error', `Invalid transition from ${item.status} to ${next}`);
      return;
    }
    const res = await updateFeedbackStatus(item.id, next);
    if (!res.success) showToast('error', res.error);
  };

  const handlePriorityChange = async (item: FeedbackItem, next: FeedbackPriority) => {
    if (next === item.priority) return;
    const res = await updateFeedbackPriority(item.id, next);
    if (!res.success) showToast('error', res.error);
  };

  const handleDelete = async (item: FeedbackItem) => {
    if (!window.confirm(`Delete this feedback from ${item.authorName ?? 'user'}? This can't be undone.`)) {
      return;
    }
    const res = await deleteFeedback(item.id);
    if (res.success) showToast('success', 'Deleted');
    else showToast('error', res.error);
  };

  const handleCopyOne = async (item: FeedbackItem) => {
    try {
      await navigator.clipboard.writeText(buildPrompt(item));
      showToast('success', 'Copied to clipboard');
    } catch {
      showToast('error', 'Could not access the clipboard');
    }
  };

  const handleCopyMany = async (selected: FeedbackItem[]) => {
    if (selected.length === 0) {
      showToast('error', 'Nothing selected');
      return;
    }
    const text = selected
      .map((it, idx) => `--- ${idx + 1}/${selected.length} ---\n${buildPrompt(it)}`)
      .join('\n\n');
    try {
      await navigator.clipboard.writeText(text);
      showToast('success', `Copied ${selected.length} item${selected.length === 1 ? '' : 's'}`);
      return selected.map((s) => s.id);
    } catch {
      showToast('error', 'Could not access the clipboard');
      return [];
    }
  };

  const handleCopyAllPending = async () => {
    const pending = items.filter((i) => i.status === 'pending');
    const ids = await handleCopyMany(pending);
    if (ids && ids.length > 0) {
      setShowCopiedPrompt({ open: true, ids });
    }
  };

  const handleCopySelected = async () => {
    const selected = items.filter((i) => selectedIds.has(i.id));
    const ids = await handleCopyMany(selected);
    if (ids && ids.length > 0) {
      setShowCopiedPrompt({ open: true, ids });
    }
  };

  const handleMarkInProgressAfterCopy = async () => {
    const ids = showCopiedPrompt.ids;
    setShowCopiedPrompt({ open: false, ids: [] });
    const results = await Promise.all(
      ids.map(async (id) => {
        const item = items.find((i) => i.id === id);
        if (!item) return { id, ok: false };
        if (!isValidTransition(item.status, 'in-progress')) return { id, ok: true };
        const res = await updateFeedbackStatus(id, 'in-progress');
        return { id, ok: res.success };
      })
    );
    const failed = results.filter((r) => !r.ok).length;
    if (failed > 0) showToast('error', `${failed} item${failed === 1 ? '' : 's'} failed to update`);
    else showToast('success', `Marked ${results.length} as In Progress`);
  };

  const handleSaveResponse = async (id: string) => {
    const draft = responseDraft[id]?.trim() ?? '';
    const value = draft.length === 0 ? null : draft;
    const res = await updateAdminResponse(id, value);
    if (res.success) {
      showToast('success', value ? 'Response saved' : 'Response cleared');
      setResponseOpen((s) => ({ ...s, [id]: false }));
    } else {
      showToast('error', res.error);
    }
  };

  const handleSaveEdit = async (id: string) => {
    const next = (editing[id] ?? '').trim();
    if (next.length === 0) {
      showToast('error', 'Description cannot be empty');
      return;
    }
    const res = await updateFeedbackDescription(id, next);
    if (res.success) {
      showToast('success', 'Description updated');
      setEditing((e) => ({ ...e, [id]: null }));
    } else {
      showToast('error', res.error);
    }
  };

  const selectedCount = selectedIds.size;

  return (
    <div className="min-h-screen bg-surface-base">
      {/* Page header */}
      <header className="border-b border-stroke chrome-bg">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-h3 font-semibold text-content-primary">Feedback Inbox</h1>
            <p className="text-label text-content-secondary mt-0.5">
              In-app feedback from Metrics Hub users — Shift+Click to add a new item.
            </p>
          </div>
          <AxisButton variant="outlined" size="sm" onClick={() => router.push('/')}>
            Back to dashboard
          </AxisButton>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-4">
        {/* Toolbar — status tabs + person filter + copy actions */}
        <div className="flex flex-col gap-3">
          <AxisNavigationTab
            activeTab={activeTab}
            onTabChange={(id) => setActiveTab(id as FeedbackStatus)}
            tabs={tabs}
            variant="line"
          />
          <div className="flex flex-wrap items-center gap-2">
            {uniqueAuthors.length > 1 && (
              <div className="w-48">
                <AxisSelect
                  value={selectedPerson}
                  onChange={(val) => setSelectedPerson(val)}
                  options={personOptions}
                  size="sm"
                />
              </div>
            )}
            <div className="ml-auto flex flex-wrap items-center gap-2">
              {selectedCount > 0 && (
                <>
                  <AxisButton
                    variant="outlined"
                    size="sm"
                    iconLeft={<CopyIcon className="w-4 h-4" />}
                    onClick={handleCopySelected}
                  >
                    Copy selected ({selectedCount})
                  </AxisButton>
                  <AxisButton variant="ghost" size="sm" onClick={clearSelection}>
                    Clear
                  </AxisButton>
                </>
              )}
              <AxisButton
                variant="filled"
                size="sm"
                iconLeft={<CopyIcon className="w-4 h-4" />}
                onClick={handleCopyAllPending}
                disabled={counts.pending === 0}
                title={
                  activeTab !== 'pending'
                    ? `Copies the ${counts.pending} pending items (not the items shown on this tab).`
                    : undefined
                }
              >
                Copy all pending ({counts.pending})
              </AxisButton>
            </div>
          </div>
        </div>

        {/* "Mark as In Progress?" banner after Copy All */}
        {showCopiedPrompt.open && (
          <AxisCallout type="info">
            <div className="flex flex-wrap items-center gap-3 justify-between">
              <span>
                Copied {showCopiedPrompt.ids.length} item
                {showCopiedPrompt.ids.length === 1 ? '' : 's'}. Mark them all as <strong>In Progress</strong>?
              </span>
              <div className="flex items-center gap-2">
                <AxisButton variant="filled" size="sm" onClick={handleMarkInProgressAfterCopy}>
                  Yes, mark all
                </AxisButton>
                <AxisButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCopiedPrompt({ open: false, ids: [] })}
                >
                  No thanks
                </AxisButton>
              </div>
            </div>
          </AxisCallout>
        )}

        {/* Bulk-select bar */}
        {filteredItems.length > 0 && (
          <div className="flex items-center justify-between text-label text-content-secondary">
            <AxisCheckbox
              checked={allFilteredSelected}
              onChange={toggleSelectAllFiltered}
              label={`Select all ${filteredItems.length} ${activeTab === 'pending' ? 'pending' : activeTab === 'in-progress' ? 'in-progress' : activeTab}`}
            />
            {selectedCount > 0 && <span>{selectedCount} selected</span>}
          </div>
        )}

        {/* Error */}
        {error && (
          <AxisCallout
            type="error"
            title={errorIsAuth ? 'Access denied' : "Couldn't load feedback"}
          >
            {error}
          </AxisCallout>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <AxisSkeleton key={i} variant="custom" width="100%" height="120px" />
            ))}
          </div>
        )}

        {/* Empty states */}
        {!loading && !error && filteredItems.length === 0 && (
          <AxisCard variant="default" padding="none" className="p-6">
            <div className="text-center text-content-secondary py-6">
              {items.length === 0
                ? 'No feedback yet — use feedback mode (sidebar button) to capture ideas, bugs, and questions while you browse the dashboards.'
                : `No ${activeTab} feedback${selectedPerson ? ` from ${selectedPerson}` : ''}.`}
            </div>
          </AxisCard>
        )}

        {/* Items */}
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const parsed = parseFeedback(item.description);
            const ctx = item.componentContext;
            const isEditing = editing[item.id] != null;
            const isResponseOpen = !!responseOpen[item.id];
            const isContextExpanded = !!contextExpanded[item.id];
            const isDeviceExpanded = !!deviceExpanded[item.id];

            return (
              <AxisCard key={item.id} variant="default" padding="none" className="p-5">
                <div className="flex items-start gap-4">
                  <AxisCheckbox
                    checked={selectedIds.has(item.id)}
                    onChange={() => toggleItem(item.id)}
                    aria-label="Select item"
                  />

                  <div className="flex-1 min-w-0 flex flex-col gap-3">
                    {/* Top row — author + badges + delete */}
                    <div className="flex items-start gap-3 flex-wrap">
                      <div
                        className="flex items-center justify-center w-8 h-8 rounded-full bg-main-100 dark:bg-main-900 text-main-700 dark:text-main-200 text-button-small font-semibold shrink-0"
                        aria-hidden="true"
                      >
                        {getInitials(item.authorName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-body-regular font-medium text-content-primary truncate">
                          {item.authorName ?? 'Unknown user'}
                        </div>
                        <div className="text-label text-content-tertiary">
                          {relativeTime(item.createdAt)}
                          {item.authorEmail ? ` · ${item.authorEmail}` : ''}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {parsed.type && (
                          <AxisTag color={tagColorForType(parsed.type)} size="sm">
                            {parsed.type.charAt(0).toUpperCase() + parsed.type.slice(1)}
                          </AxisTag>
                        )}
                        <AxisTag color={tagColorForStatus(item.status)} size="sm" dot>
                          {STATUS_TABS_BASE.find((t) => t.id === item.status)?.name ?? item.status}
                        </AxisTag>
                        <AxisTag color={tagColorForPriority(item.priority)} size="sm">
                          {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
                        </AxisTag>
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          className="ml-1 p-1.5 rounded text-content-tertiary hover:text-error-500 hover:bg-error-100 dark:hover:bg-error-900/40 transition-colors"
                          aria-label="Delete feedback"
                          title="Delete"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* User message */}
                    {!isEditing ? (
                      <div className="text-body-regular text-content-primary whitespace-pre-wrap">
                        {parsed.userMessage || (
                          <span className="text-content-tertiary italic">(no description)</span>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <textarea
                          value={editing[item.id] ?? ''}
                          onChange={(e) =>
                            setEditing((s) => ({ ...s, [item.id]: e.target.value }))
                          }
                          rows={3}
                          className="w-full px-3 py-2 text-body-regular bg-surface-base border border-stroke rounded-sm focus:outline-none focus:border-main-500 focus:ring-2 focus:ring-main-200 text-content-primary"
                        />
                        <div className="flex items-center gap-2">
                          <AxisButton variant="filled" size="sm" onClick={() => handleSaveEdit(item.id)}>
                            Save
                          </AxisButton>
                          <AxisButton
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setEditing((e) => ({ ...e, [item.id]: null }))
                            }
                          >
                            Cancel
                          </AxisButton>
                        </div>
                      </div>
                    )}

                    {/* Location pill */}
                    {ctx && (ctx.pageRoute || ctx.sectionName || ctx.label) && (
                      <div className="text-label text-content-secondary">
                        <span aria-hidden="true">📍 </span>
                        {[ctx.pageRoute, ctx.sectionName, ctx.label && `"${ctx.label}"`]
                          .filter(Boolean)
                          .join(' · ')}
                      </div>
                    )}

                    {/* Admin response (if set) */}
                    {item.adminResponse && (
                      <div className="rounded-md border border-info-300 bg-info-100/40 dark:bg-info-900/20 px-3 py-2">
                        <div className="text-label font-medium text-info-700 dark:text-info-300 mb-0.5">
                          Admin response
                        </div>
                        <div className="text-body-regular text-content-primary whitespace-pre-wrap">
                          {item.adminResponse}
                        </div>
                      </div>
                    )}

                    {/* Action row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <AxisButton
                        variant="outlined"
                        size="sm"
                        iconLeft={<CopyIcon className="w-4 h-4" />}
                        onClick={() => handleCopyOne(item)}
                      >
                        Copy as Prompt
                      </AxisButton>
                      <AxisButton
                        variant="ghost"
                        size="sm"
                        iconLeft={<PencilIcon className="w-4 h-4" />}
                        onClick={() =>
                          setEditing((e) => ({ ...e, [item.id]: parsed.userMessage }))
                        }
                      >
                        Edit
                      </AxisButton>
                      <AxisButton
                        variant="ghost"
                        size="sm"
                        iconLeft={<ChevronDownIcon className={`w-4 h-4 transition-transform ${isContextExpanded ? 'rotate-180' : ''}`} />}
                        onClick={() =>
                          setContextExpanded((s) => ({ ...s, [item.id]: !isContextExpanded }))
                        }
                      >
                        {isContextExpanded ? 'Hide' : 'Show'} full context
                      </AxisButton>
                      <AxisButton
                        variant="ghost"
                        size="sm"
                        iconLeft={<ChevronDownIcon className={`w-4 h-4 transition-transform ${isDeviceExpanded ? 'rotate-180' : ''}`} />}
                        onClick={() =>
                          setDeviceExpanded((s) => ({ ...s, [item.id]: !isDeviceExpanded }))
                        }
                      >
                        {isDeviceExpanded ? 'Hide' : 'Show'} device
                      </AxisButton>
                      <AxisButton
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setResponseDraft((s) => ({
                            ...s,
                            [item.id]: item.adminResponse ?? '',
                          }));
                          setResponseOpen((s) => ({ ...s, [item.id]: !isResponseOpen }));
                        }}
                      >
                        {isResponseOpen ? 'Cancel response' : item.adminResponse ? 'Edit response' : 'Respond'}
                      </AxisButton>
                    </div>

                    {/* Status + priority quick pickers */}
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="w-44">
                        <AxisSelect
                          label="Status"
                          value={item.status}
                          onChange={(v) => handleStatusChange(item, v as FeedbackStatus)}
                          options={STATUS_OPTIONS}
                          size="sm"
                        />
                      </div>
                      <div className="w-44">
                        <AxisSelect
                          label="Priority"
                          value={item.priority}
                          onChange={(v) => handlePriorityChange(item, v as FeedbackPriority)}
                          options={PRIORITY_OPTIONS}
                          size="sm"
                        />
                      </div>
                    </div>

                    {/* Response editor */}
                    {isResponseOpen && (
                      <div className="flex flex-col gap-2">
                        <textarea
                          value={responseDraft[item.id] ?? ''}
                          onChange={(e) =>
                            setResponseDraft((s) => ({ ...s, [item.id]: e.target.value }))
                          }
                          placeholder="Write a response visible to the author and other readers"
                          rows={3}
                          className="w-full px-3 py-2 text-body-regular bg-surface-base border border-stroke rounded-sm focus:outline-none focus:border-main-500 focus:ring-2 focus:ring-main-200 text-content-primary"
                        />
                        <div className="flex items-center gap-2">
                          <AxisButton variant="filled" size="sm" onClick={() => handleSaveResponse(item.id)}>
                            Save response
                          </AxisButton>
                          <AxisButton
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setResponseOpen((s) => ({ ...s, [item.id]: false }))
                            }
                          >
                            Cancel
                          </AxisButton>
                        </div>
                      </div>
                    )}

                    {/* Full context */}
                    {isContextExpanded && (
                      <div className="rounded-md bg-surface-raised border border-stroke px-3 py-2 text-label font-mono text-content-secondary whitespace-pre-wrap">
                        {parsed.aiContext ?? '(no AI context block — likely a legacy item)'}
                      </div>
                    )}

                    {/* Device */}
                    {isDeviceExpanded && (
                      <div className="rounded-md bg-surface-raised border border-stroke px-3 py-2 text-label text-content-secondary">
                        {item.deviceContext ? (
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                            <span className="text-content-tertiary">OS</span>
                            <span>{item.deviceContext.os}</span>
                            <span className="text-content-tertiary">Browser</span>
                            <span>{item.deviceContext.browser}</span>
                            <span className="text-content-tertiary">Screen</span>
                            <span>{item.deviceContext.screenResolution}</span>
                            <span className="text-content-tertiary">Viewport</span>
                            <span>{item.deviceContext.viewportSize}</span>
                            <span className="text-content-tertiary">Pixel ratio</span>
                            <span>{item.deviceContext.pixelRatio}×</span>
                          </div>
                        ) : (
                          <span className="italic">No device info captured.</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </AxisCard>
            );
          })}
        </div>
      </div>

      <FeedbackInlineToast
        open={toast.open}
        variant={toast.variant}
        message={toast.message}
        onDismiss={() => setToast((t) => ({ ...t, open: false }))}
      />
      {/* Floating close affordance for mobile bulk-select */}
      {selectedCount > 0 && (
        <button
          type="button"
          onClick={clearSelection}
          aria-label="Clear selection"
          className="fixed bottom-6 left-6 sm:hidden inline-flex items-center justify-center w-10 h-10 rounded-full bg-surface-base border border-stroke shadow-md text-content-secondary hover:text-content-primary"
        >
          <CloseIcon className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
