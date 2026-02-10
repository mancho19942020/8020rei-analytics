/**
 * Top Pages Widget
 *
 * Table showing the most viewed pages in the application.
 * Displays page path, client, views, and unique users.
 */

'use client';

interface TopPageData {
  page_url: string;
  client: string;
  path: string;
  views: number;
  unique_users: number;
}

interface TopPagesWidgetProps {
  data: TopPageData[];
}

// Format path for display (truncate long paths)
function formatPath(path: string | null): string {
  if (!path) return '/';
  // Truncate if too long
  if (path.length > 40) {
    return path.slice(0, 37) + '...';
  }
  return path;
}

export function TopPagesWidget({ data }: TopPagesWidgetProps) {
  return (
    <div className="h-full overflow-auto">
      <table className="w-full">
        <thead className="sticky top-0 bg-surface-raised z-10">
          <tr className="border-b border-stroke">
            <th className="text-left py-2 px-3 text-xs font-medium text-content-tertiary uppercase tracking-wider">
              Page
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
                <div className="flex flex-col">
                  <span
                    className="text-sm font-medium text-content-primary font-mono"
                    title={item.path || '/'}
                  >
                    {formatPath(item.path)}
                  </span>
                </div>
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
