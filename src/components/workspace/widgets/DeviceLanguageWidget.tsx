/**
 * Device Language Widget
 *
 * Displays device language distribution (en-us, es, etc.)
 * as a table with users and events.
 */

'use client';

interface LanguageData {
  language: string;
  users: number;
  events: number;
}

interface DeviceLanguageWidgetProps {
  data: LanguageData[];
}

// Get language display name from locale code
function getLanguageDisplayName(code: string): string {
  if (!code || code === '(not set)') return '(not set)';

  try {
    // Try to get the display name using Intl API
    const displayNames = new Intl.DisplayNames(['en'], { type: 'language' });
    const displayName = displayNames.of(code.split('-')[0]);
    if (displayName) {
      // Add region if present
      const parts = code.split('-');
      if (parts.length > 1) {
        return `${displayName} (${parts[1].toUpperCase()})`;
      }
      return displayName;
    }
  } catch {
    // Fallback to uppercase code
  }

  return code.toUpperCase();
}

export function DeviceLanguageWidget({ data }: DeviceLanguageWidgetProps) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-content-tertiary text-sm">No language data available</p>
      </div>
    );
  }

  // Calculate total for percentage
  const totalUsers = data.reduce((sum, item) => sum + item.users, 0);

  return (
    <div className="w-full h-full overflow-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-surface-raised">
          <tr className="border-b border-stroke">
            <th className="text-left py-2 px-3 font-medium text-content-secondary">
              Language
            </th>
            <th className="text-left py-2 px-3 font-medium text-content-secondary">
              Code
            </th>
            <th className="text-right py-2 px-3 font-medium text-content-secondary">
              Users
            </th>
            <th className="text-right py-2 px-3 font-medium text-content-secondary">
              %
            </th>
            <th className="text-right py-2 px-3 font-medium text-content-secondary">
              Events
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => {
            const percentage = totalUsers > 0 ? ((item.users / totalUsers) * 100) : 0;
            return (
              <tr
                key={item.language || index}
                className={`border-b border-stroke hover:bg-surface-base transition-colors ${
                  index % 2 === 0 ? '' : 'bg-surface-base/50'
                }`}
              >
                <td className="py-2 px-3 text-content-primary font-medium">
                  {getLanguageDisplayName(item.language)}
                </td>
                <td className="py-2 px-3 text-content-tertiary font-mono text-xs">
                  {item.language || '—'}
                </td>
                <td className="py-2 px-3 text-right text-content-primary tabular-nums">
                  {item.users.toLocaleString()}
                </td>
                <td className="py-2 px-3 text-right text-content-secondary tabular-nums">
                  {percentage.toFixed(1)}%
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
