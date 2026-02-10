/**
 * Feature Adoption Widget
 *
 * Table showing feature adoption rate (% of clients using each feature).
 * Styled consistently with other dashboard tables.
 */

'use client';

interface FeatureAdoptionData {
  feature: string;
  clients_using: number;
  adoption_pct: number;
}

interface FeatureAdoptionWidgetProps {
  data: FeatureAdoptionData[];
}

// Progress bar component for adoption percentage
function AdoptionBar({ percentage }: { percentage: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-main-500 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <span className="text-sm font-medium text-content-primary min-w-[48px] text-right">
        {percentage.toFixed(1)}%
      </span>
    </div>
  );
}

export function FeatureAdoptionWidget({ data }: FeatureAdoptionWidgetProps) {
  return (
    <div className="h-full overflow-auto">
      <table className="w-full">
        <thead className="sticky top-0 bg-surface-raised z-10">
          <tr className="border-b border-stroke">
            <th className="text-left py-2 px-3 text-xs font-medium text-content-tertiary uppercase tracking-wider">
              Feature
            </th>
            <th className="text-right py-2 px-3 text-xs font-medium text-content-tertiary uppercase tracking-wider w-24">
              Clients
            </th>
            <th className="text-left py-2 px-3 text-xs font-medium text-content-tertiary uppercase tracking-wider w-48">
              Adoption Rate
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr
              key={item.feature}
              className={`border-b border-stroke hover:bg-surface-base transition-colors duration-150 ${
                index % 2 === 0 ? 'bg-surface-raised' : 'bg-surface-raised/50'
              }`}
            >
              <td className="py-2.5 px-3">
                <span className="text-sm font-medium text-content-primary">
                  {item.feature}
                </span>
              </td>
              <td className="py-2.5 px-3 text-right">
                <span className="text-sm tabular-nums text-content-secondary">
                  {item.clients_using}
                </span>
              </td>
              <td className="py-2.5 px-3">
                <AdoptionBar percentage={item.adoption_pct} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {data.length === 0 && (
        <div className="flex items-center justify-center h-32 text-content-tertiary text-sm">
          No adoption data available
        </div>
      )}
    </div>
  );
}
