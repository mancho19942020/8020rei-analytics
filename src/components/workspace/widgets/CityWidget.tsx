/**
 * City Widget
 *
 * Displays users by city in a table format.
 * Shows the top cities by user count with their state/region.
 */

'use client';

interface CityData {
  city: string;
  region: string;
  users: number;
  events: number;
}

interface CityWidgetProps {
  data: CityData[];
}

export function CityWidget({ data }: CityWidgetProps) {
  // Calculate total for percentage
  const totalUsers = data.reduce((sum, item) => sum + item.users, 0);

  return (
    <div className="w-full h-full overflow-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-surface-raised">
          <tr className="border-b border-stroke">
            <th className="text-left py-2 px-3 font-semibold text-content-secondary">
              City
            </th>
            <th className="text-left py-2 px-3 font-semibold text-content-secondary">
              State
            </th>
            <th className="text-right py-2 px-3 font-semibold text-content-secondary">
              Users
            </th>
            <th className="text-right py-2 px-3 font-semibold text-content-secondary">
              %
            </th>
            <th className="text-right py-2 px-3 font-semibold text-content-secondary">
              Events
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => {
            const percentage = totalUsers > 0 ? ((item.users / totalUsers) * 100).toFixed(1) : '0.0';
            return (
              <tr
                key={`${item.city}-${item.region}-${index}`}
                className="border-b border-stroke/50 hover:bg-surface-base/50 transition-colors"
              >
                <td className="py-2 px-3 text-content-primary font-medium">
                  {item.city || '(not set)'}
                </td>
                <td className="py-2 px-3 text-content-secondary">
                  {item.region || '(not set)'}
                </td>
                <td className="py-2 px-3 text-right text-content-primary tabular-nums">
                  {item.users.toLocaleString()}
                </td>
                <td className="py-2 px-3 text-right text-content-tertiary tabular-nums">
                  {percentage}%
                </td>
                <td className="py-2 px-3 text-right text-content-secondary tabular-nums">
                  {item.events.toLocaleString()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
