'use client';

import { AxisCard, AxisButton } from '@/components/axis';
import type { GrafanaDashboard } from './types';

interface GrafanaDashboardCardProps {
  dashboard: GrafanaDashboard;
}

export function GrafanaDashboardCard({ dashboard }: GrafanaDashboardCardProps) {
  return (
    <AxisCard variant="outlined" padding="none" className="flex flex-col">
      <div style={{ padding: '20px 20px 16px', flex: 1 }}>
        {/* Grafana icon */}
        <div style={{ marginBottom: 12 }}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            style={{ color: 'var(--accent-2-500)' }}
          >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              stroke="currentColor"
              d="M8 12h8M12 8v8"
            />
          </svg>
        </div>

        {/* Dashboard name */}
        <p className="text-body-regular font-semibold text-content-primary" style={{ marginBottom: 4 }}>
          {dashboard.name}
        </p>

        {/* Optional description */}
        {dashboard.description && (
          <p
            className="text-label text-content-secondary"
            style={{
              marginBottom: 0,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {dashboard.description}
          </p>
        )}
      </div>

      {/* Action footer */}
      <div
        className="border-t border-stroke"
        style={{ padding: '12px 16px' }}
      >
        <AxisButton
          variant="outlined"
          size="sm"
          fullWidth
          onClick={() => window.open(dashboard.url, '_blank', 'noopener,noreferrer')}
          iconRight={
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          }
        >
          Open in Grafana
        </AxisButton>
      </div>
    </AxisCard>
  );
}
