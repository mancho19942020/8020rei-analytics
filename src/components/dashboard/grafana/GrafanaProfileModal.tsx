'use client';

import { useState, useEffect } from 'react';
import { AxisModal, AxisButton, AxisInput, AxisCallout } from '@/components/axis';
import type { GrafanaContributor, GrafanaDashboard } from './types';

interface DashboardDraft {
  id: string;
  name: string;
  url: string;
  description: string;
}

interface GrafanaProfileModalProps {
  open: boolean;
  onClose: () => void;
  /** Existing profile to edit; undefined = create mode */
  existing?: GrafanaContributor;
  /** Pre-filled name from Firebase Auth */
  defaultName: string;
  /** Pre-filled email from Firebase Auth */
  defaultEmail: string;
  onSave: (data: { name: string; title: string; dashboards: GrafanaDashboard[] }) => Promise<void>;
  /** Delete own profile entirely; only passed when a profile exists */
  onDelete?: () => Promise<void>;
}

function emptyDashboard(): DashboardDraft {
  return { id: crypto.randomUUID(), name: '', url: '', description: '' };
}

export function GrafanaProfileModal({
  open,
  onClose,
  existing,
  defaultName,
  defaultEmail,
  onSave,
  onDelete,
}: GrafanaProfileModalProps) {
  const isEdit = !!existing;

  const [name, setName] = useState(defaultName);
  const [title, setTitle] = useState('');
  const [dashboards, setDashboards] = useState<DashboardDraft[]>([emptyDashboard()]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Populate fields when editing
  useEffect(() => {
    if (open) {
      if (existing) {
        setName(existing.name);
        setTitle(existing.title);
        setDashboards(
          existing.dashboards.length > 0
            ? existing.dashboards.map(d => ({ ...d, description: d.description ?? '' }))
            : [emptyDashboard()]
        );
      } else {
        setName(defaultName);
        setTitle('');
        setDashboards([emptyDashboard()]);
      }
      setError(null);
      setConfirmDelete(false);
    }
  }, [open, existing, defaultName]);

  function updateDashboard(id: string, field: keyof DashboardDraft, value: string) {
    setDashboards(prev =>
      prev.map(d => (d.id === id ? { ...d, [field]: value } : d))
    );
  }

  function addDashboard() {
    setDashboards(prev => [...prev, emptyDashboard()]);
  }

  function removeDashboard(id: string) {
    setDashboards(prev => prev.filter(d => d.id !== id));
  }

  async function handleSubmit() {
    setError(null);

    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    if (!title.trim()) {
      setError('Title / role is required.');
      return;
    }

    // Filter out empty rows; validate URLs of non-empty rows
    const filled = dashboards.filter(d => d.name.trim() || d.url.trim());
    for (const d of filled) {
      if (!d.name.trim()) {
        setError('Each dashboard entry needs a name.');
        return;
      }
      if (!d.url.trim()) {
        setError('Each dashboard entry needs a URL.');
        return;
      }
      if (!d.url.startsWith('http')) {
        setError(`URL must start with http or https: "${d.url}"`);
        return;
      }
    }

    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        title: title.trim(),
        dashboards: filled.map(d => ({
          id: d.id,
          name: d.name.trim(),
          url: d.url.trim(),
          ...(d.description.trim() ? { description: d.description.trim() } : {}),
        })),
      });
      onClose();
    } catch (err) {
      setError('Failed to save. Please try again.');
      console.error('[GrafanaProfileModal] save error:', err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!onDelete) return;
    setDeleting(true);
    try {
      await onDelete();
    } catch (err) {
      setError('Failed to delete. Please try again.');
      console.error('[GrafanaProfileModal] delete error:', err);
      setDeleting(false);
    }
  }

  const footer = (
    <>
      <AxisButton variant="ghost" size="md" onClick={onClose} disabled={saving}>
        Cancel
      </AxisButton>
      <AxisButton variant="filled" size="md" onClick={handleSubmit} loading={saving}>
        {isEdit ? 'Save changes' : 'Create profile'}
      </AxisButton>
    </>
  );

  return (
    <AxisModal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit your dashboards' : 'Add your dashboards'}
      size="md"
      footer={footer}
      disableBackdropClose={saving}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Error banner */}
        {error && (
          <AxisCallout type="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </AxisCallout>
        )}

        {/* Profile fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p className="text-label font-semibold text-content-secondary" style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Your Info
          </p>
          <AxisInput
            label="Display name"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Johan Doe"
            required
          />
          <AxisInput
            label="Title / role"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Backend Lead"
            required
          />
          <AxisInput
            label="Email"
            value={defaultEmail}
            disabled
            helperText="Auto-filled from your account"
          />
        </div>

        {/* Divider */}
        <div className="border-t border-stroke" />

        {/* Dashboard entries */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p className="text-label font-semibold text-content-secondary" style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Grafana Dashboards
          </p>

          {dashboards.map((dash, idx) => (
            <div
              key={dash.id}
              className="border border-stroke"
              style={{ borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <p className="text-label font-medium text-content-primary" style={{ margin: 0 }}>
                  Dashboard {idx + 1}
                </p>
                {dashboards.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeDashboard(dash.id)}
                    className="text-content-tertiary hover:text-error-500 transition-colors"
                    aria-label={`Remove dashboard ${idx + 1}`}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                  >
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                )}
              </div>

              <AxisInput
                label="Dashboard name"
                value={dash.name}
                onChange={e => updateDashboard(dash.id, 'name', e.target.value)}
                placeholder="e.g. API Monitoring"
              />
              <AxisInput
                label="Grafana URL"
                type="url"
                value={dash.url}
                onChange={e => updateDashboard(dash.id, 'url', e.target.value)}
                placeholder="https://grafana.example.com/d/..."
              />
              <AxisInput
                label="Description (optional)"
                value={dash.description}
                onChange={e => updateDashboard(dash.id, 'description', e.target.value)}
                placeholder="Brief description of what this dashboard shows"
              />
            </div>
          ))}

          {/* Add another */}
          <button
            type="button"
            onClick={addDashboard}
            className="text-main-500 hover:text-main-700 transition-colors text-label font-medium"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: 0,
              alignSelf: 'flex-start',
            }}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add another dashboard
          </button>
        </div>

        {/* Delete zone — only in edit mode */}
        {isEdit && onDelete && (
          <>
            <div className="border-t border-stroke" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p className="text-label font-semibold text-content-secondary" style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Danger zone
              </p>
              {confirmDelete ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <p className="text-sm text-content-secondary" style={{ margin: 0 }}>
                    This will permanently delete your profile and all linked dashboards. This cannot be undone.
                  </p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <AxisButton
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmDelete(false)}
                      disabled={deleting}
                    >
                      Cancel
                    </AxisButton>
                    <AxisButton
                      variant="filled"
                      size="sm"
                      onClick={handleDeleteConfirm}
                      loading={deleting}
                      style={{ backgroundColor: 'var(--error-600)', borderColor: 'var(--error-600)' }}
                    >
                      Yes, delete my profile
                    </AxisButton>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="text-error-500 hover:text-error-700 transition-colors text-label font-medium"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: 0,
                    alignSelf: 'flex-start',
                  }}
                >
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                  Delete my profile
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </AxisModal>
  );
}
