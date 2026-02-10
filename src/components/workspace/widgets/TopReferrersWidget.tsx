/**
 * Top Referrers Widget
 *
 * Displays a table of top referrer domains with users and events.
 */

'use client';

interface TopReferrerData {
  referrer_domain: string;
  users: number;
  events: number;
}

interface TopReferrersWidgetProps {
  data: TopReferrerData[];
}

export function TopReferrersWidget({ data }: TopReferrersWidgetProps) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-content-tertiary text-sm">No referrer data available</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-surface-raised">
          <tr className="border-b border-stroke">
            <th className="text-left py-2 px-3 font-medium text-content-secondary">
              Referrer Domain
            </th>
            <th className="text-right py-2 px-3 font-medium text-content-secondary">
              Users
            </th>
            <th className="text-right py-2 px-3 font-medium text-content-secondary">
              Events
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr
              key={item.referrer_domain}
              className={`border-b border-stroke hover:bg-surface-base transition-colors ${
                index % 2 === 0 ? '' : 'bg-surface-base/50'
              }`}
            >
              <td className="py-2 px-3 text-content-primary font-medium truncate max-w-[200px]">
                {item.referrer_domain}
              </td>
              <td className="py-2 px-3 text-right text-content-primary tabular-nums">
                {item.users.toLocaleString()}
              </td>
              <td className="py-2 px-3 text-right text-content-secondary tabular-nums">
                {item.events.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
