/**
 * Scroll Depth by Page Widget
 *
 * Displays scroll events grouped by page/feature in a table format.
 * Shows scroll events and unique users per page.
 */

'use client';

interface ScrollDepthData {
  page: string;
  scroll_events: number;
  unique_users: number;
}

interface ScrollDepthWidgetProps {
  data: ScrollDepthData[];
}

export function ScrollDepthWidget({ data }: ScrollDepthWidgetProps) {
  // Calculate total for percentage
  const totalScrolls = data.reduce((sum, item) => sum + item.scroll_events, 0);

  return (
    <div className="w-full h-full overflow-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-surface-raised z-10">
          <tr className="border-b border-stroke">
            <th className="text-left py-3 px-4 font-semibold text-content-primary">Page</th>
            <th className="text-right py-3 px-4 font-semibold text-content-primary">Scroll Events</th>
            <th className="text-right py-3 px-4 font-semibold text-content-primary">Unique Users</th>
            <th className="text-right py-3 px-4 font-semibold text-content-primary">% of Total</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => {
            const percentage = totalScrolls > 0
              ? ((item.scroll_events / totalScrolls) * 100).toFixed(1)
              : '0.0';

            return (
              <tr
                key={item.page}
                className={`border-b border-stroke/50 hover:bg-surface-base transition-colors ${
                  index % 2 === 0 ? '' : 'bg-surface-base/30'
                }`}
              >
                <td className="py-3 px-4 text-content-primary font-medium">
                  {item.page}
                </td>
                <td className="text-right py-3 px-4 text-content-secondary tabular-nums">
                  {item.scroll_events.toLocaleString()}
                </td>
                <td className="text-right py-3 px-4 text-content-secondary tabular-nums">
                  {item.unique_users.toLocaleString()}
                </td>
                <td className="text-right py-3 px-4 text-content-tertiary tabular-nums">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 h-1.5 bg-surface-base rounded-full overflow-hidden">
                      <div
                        className="h-full bg-main-500 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-12 text-right">{percentage}%</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {data.length === 0 && (
        <div className="flex items-center justify-center h-32 text-content-tertiary">
          No scroll data available
        </div>
      )}
    </div>
  );
}
