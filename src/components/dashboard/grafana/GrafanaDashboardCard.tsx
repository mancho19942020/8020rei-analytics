'use client';

import { AxisButton } from '@/components/axis';
import type { GrafanaDashboard } from './types';

interface GrafanaDashboardCardProps {
  dashboard: GrafanaDashboard;
}

export function GrafanaDashboardCard({ dashboard }: GrafanaDashboardCardProps) {
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
      {/* Grafana icon */}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          backgroundColor: 'var(--accent-2-100)',
          color: 'var(--accent-2-600)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
        aria-hidden="true"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <circle cx="12" cy="12" r="9" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h8M12 8v8" />
        </svg>
      </div>

      {/* Name + description */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          className="text-sm font-semibold text-content-primary"
          style={{ margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          {dashboard.name}
        </p>
        {dashboard.description && (
          <p
            className="text-xs text-content-secondary"
            style={{ margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          >
            {dashboard.description}
          </p>
        )}
      </div>

      {/* Open button */}
      <div style={{ flexShrink: 0 }}>
        <AxisButton
          variant="outlined"
          size="sm"
          onClick={() => window.open(dashboard.url, '_blank', 'noopener,noreferrer')}
          iconRight={
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          }
        >
          Open in Grafana
        </AxisButton>
      </div>
    </div>
  );
}
