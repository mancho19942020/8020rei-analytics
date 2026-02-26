'use client';

import { AxisCard, AxisTag, AxisButton } from '@/components/axis';
import type { GrafanaContributor } from './types';

interface GrafanaContributorCardProps {
  contributor: GrafanaContributor;
  isOwnCard: boolean;
  onView: () => void;
  onEdit: () => void;
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
  isOwnCard,
  onView,
  onEdit,
}: GrafanaContributorCardProps) {
  const initials = getInitials(contributor.name);
  const { bg, text } = avatarColor(contributor.name);
  const dashCount = contributor.dashboards.length;

  return (
    <AxisCard variant="default" padding="none" className="flex flex-col">
      <div style={{ padding: '24px 20px 16px' }}>
        {/* Avatar */}
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            backgroundColor: bg,
            color: text,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: '0.02em',
            marginBottom: 14,
            flexShrink: 0,
          }}
          aria-hidden="true"
        >
          {initials}
        </div>

        {/* Name & title */}
        <p className="text-body-regular font-semibold text-content-primary" style={{ marginBottom: 2 }}>
          {contributor.name}
        </p>
        <p className="text-label text-content-secondary" style={{ marginBottom: 12 }}>
          {contributor.title}
        </p>

        {/* Dashboard count badge */}
        <AxisTag
          color={dashCount > 0 ? 'info' : 'neutral'}
          size="sm"
          variant="filled"
          dot={dashCount > 0}
        >
          {dashCount === 0
            ? 'No dashboards yet'
            : dashCount === 1
            ? '1 dashboard'
            : `${dashCount} dashboards`}
        </AxisTag>
      </div>

      {/* Footer actions */}
      <div
        className="border-t border-stroke"
        style={{
          padding: '12px 16px',
          display: 'flex',
          gap: 8,
          marginTop: 'auto',
        }}
      >
        <AxisButton
          variant="ghost"
          size="sm"
          onClick={onView}
          disabled={dashCount === 0}
          style={{ flex: 1 }}
        >
          View Dashboards
        </AxisButton>
        {isOwnCard && (
          <AxisButton
            variant="outlined"
            size="sm"
            onClick={onEdit}
            iconLeft={
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
              </svg>
            }
          >
            Edit
          </AxisButton>
        )}
      </div>
    </AxisCard>
  );
}
