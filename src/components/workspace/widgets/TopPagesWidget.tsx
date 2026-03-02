/**
 * Top Pages Widget
 *
 * Table showing the most viewed pages (Pages & Screens) with page path,
 * client subdomain, total views, and unique users.
 * Self-contained: fetches its own data from /api/metrics/pages.
 */

'use client';

import { useState, useEffect } from 'react';

interface TopPageData {
  page_url: string;
  client: string;
  path: string;
  views: number;
  unique_users: number;
}

interface TopPagesWidgetProps {
  days: number;
  userType: 'all' | 'internal' | 'external';
  startDate?: string;
  endDate?: string;
}

function formatPath(path: string | null): string {
  if (!path) return '/';
  if (path.length > 40) return path.slice(0, 37) + '...';
  return path;
}

export function TopPagesWidget({ days, userType, startDate, endDate }: TopPagesWidgetProps) {
  const [data, setData] = useState<TopPageData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchPages() {
      if (!days || isNaN(days) || !userType) return;
      setLoading(true);
      try {
        const dateParams = startDate && endDate
          ? `startDate=${startDate}&endDate=${endDate}`
          : `days=${days}`;
        const res = await fetch(`/api/metrics/pages?${dateParams}&userType=${userType}`);
        const json = await res.json();
        if (!cancelled && json.success) {
          setData(json.data);
        }
      } catch {
        // keep previous data on error
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchPages();
    return () => { cancelled = true; };
  }, [days, userType, startDate, endDate]);

  if (loading) {
    return (
      <div className="h-full overflow-hidden">
        <div className="flex items-center gap-3 py-2 px-3 border-b border-stroke mb-1">
          <div className="h-3 bg-stroke rounded flex-1 animate-pulse" />
          <div className="h-3 bg-stroke rounded w-20 animate-pulse" />
          <div className="h-3 bg-stroke rounded w-16 animate-pulse" />
          <div className="h-3 bg-stroke rounded w-16 animate-pulse" />
        </div>
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-2.5 px-3 border-b border-stroke">
            <div className="h-3 bg-stroke rounded flex-1 animate-pulse" style={{ opacity: 1 - i * 0.1 }} />
            <div className="h-3 bg-stroke rounded w-20 animate-pulse" style={{ opacity: 1 - i * 0.1 }} />
            <div className="h-3 bg-stroke rounded w-16 animate-pulse" style={{ opacity: 1 - i * 0.1 }} />
            <div className="h-3 bg-stroke rounded w-16 animate-pulse" style={{ opacity: 1 - i * 0.1 }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <table className="w-full">
        <thead className="sticky top-0 bg-surface-raised z-10">
          <tr className="border-b border-stroke">
            <th className="text-left py-2 px-3 text-xs font-medium text-content-tertiary uppercase tracking-wider">
              Page Path
            </th>
            <th className="text-left py-2 px-3 text-xs font-medium text-content-tertiary uppercase tracking-wider w-32">
              Client
            </th>
            <th className="text-right py-2 px-3 text-xs font-medium text-content-tertiary uppercase tracking-wider w-24">
              Views
            </th>
            <th className="text-right py-2 px-3 text-xs font-medium text-content-tertiary uppercase tracking-wider w-24">
              Users
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr
              key={item.page_url}
              className={`border-b border-stroke hover:bg-surface-base transition-colors duration-150 ${
                index % 2 === 0 ? 'bg-surface-raised' : 'bg-surface-raised/50'
              }`}
            >
              <td className="py-2.5 px-3">
                <span
                  className="text-sm font-medium text-content-primary font-mono"
                  title={item.path || '/'}
                >
                  {formatPath(item.path)}
                </span>
              </td>
              <td className="py-2.5 px-3">
                <span className="text-sm text-content-secondary">
                  {item.client || '-'}
                </span>
              </td>
              <td className="py-2.5 px-3 text-right">
                <span className="text-sm font-medium tabular-nums text-content-primary">
                  {item.views.toLocaleString()}
                </span>
              </td>
              <td className="py-2.5 px-3 text-right">
                <span className="text-sm tabular-nums text-content-secondary">
                  {item.unique_users.toLocaleString()}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {data.length === 0 && (
        <div className="flex items-center justify-center h-32 text-content-tertiary text-sm">
          No page data available
        </div>
      )}
    </div>
  );
}
