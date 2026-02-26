'use client';

import { AxisTag, AxisButton } from '@/components/axis';
import type { GrafanaContributor } from './types';

interface GrafanaContributorCardProps {
  contributor: GrafanaContributor;
  onView: () => void;
}

/** Generates initials from a display name (e.g. "Johan Doe" → "JD") */
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/** Deterministic accent color from name string */
const AVATAR_COLORS = [
  { bg: 'var(--main-100)', text: 'var(--main-700)' },
  { bg: 'var(--success-100)', text: 'var(--success-700)' },
  { bg: 'var(--accent-1-100)', text: 'var(--accent-1-700)' },
  { bg: 'var(--accent-2-100)', text: 'var(--accent-2-700)' },
  { bg: 'var(--accent-3-100)', text: 'var(--accent-3-700)' },
];

function avatarColor(name: string) {
  const idx = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

export function GrafanaContributorCard({
  contributor,
  onView,
}: GrafanaContributorCardProps) {
  const initials = getInitials(contributor.name);
  const { bg, text } = avatarColor(contributor.name);
  const dashCount = contributor.dashboards.length;

  return (
    <div
      className="bg-surface-raised border border-stroke"
      style={{
        borderRadius: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '12px 16px',
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          backgroundColor: bg,
          color: text,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: '0.04em',
          flexShrink: 0,
        }}
        aria-hidden="true"
      >
        {initials}
      </div>

      {/* Name + role */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          className="text-sm font-semibold text-content-primary"
          style={{ margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          {contributor.name}
        </p>
        <p className="text-xs text-content-secondary" style={{ margin: 0 }}>
          {contributor.title}
        </p>
      </div>

      {/* Dashboard count */}
      <AxisTag
        color={dashCount > 0 ? 'info' : 'neutral'}
        size="sm"
        variant="filled"
        dot={dashCount > 0}
      >
        {dashCount === 0
          ? 'No dashboards'
          : dashCount === 1
          ? '1 dashboard'
          : `${dashCount} dashboards`}
      </AxisTag>

      {/* Actions */}
      <div style={{ flexShrink: 0 }}>
        <AxisButton
          variant="filled"
          size="sm"
          onClick={onView}
          disabled={dashCount === 0}
        >
          View dashboards
        </AxisButton>
      </div>
    </div>
  );
}
