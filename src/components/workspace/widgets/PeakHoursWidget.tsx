/**
 * Peak Hours Widget
 *
 * Displays a heatmap grid showing activity by hour of day
 * and day of week, colored by session intensity.
 */

'use client';

interface PeakHoursData {
  day_of_week: number;
  hour: number;
  sessions: number;
}

interface PeakHoursWidgetProps {
  data: PeakHoursData[];
}

// GA4 day_of_week: 1=Sunday, 2=Monday, ..., 7=Saturday
// Reorder so Monday is first
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const GA4_DAY_ORDER = [2, 3, 4, 5, 6, 7, 1]; // Monday first

function formatHour(hour: number): string {
  if (hour === 0) return '12am';
  if (hour < 12) return `${hour}am`;
  if (hour === 12) return '12pm';
  return `${hour - 12}pm`;
}

// Map session count to a heatmap intensity level.
// Uses CSS variables (--heatmap-0 through --heatmap-4) defined in globals.css
// so the scale adapts per theme: light mode goes light→dark blue,
// dark mode goes muted gray→bright blue.
function getCellColor(sessions: number, maxSessions: number): string {
  if (maxSessions === 0 || sessions === 0) return 'var(--heatmap-0)';
  const ratio = sessions / maxSessions;
  if (ratio < 0.15) return 'var(--heatmap-1)';
  if (ratio < 0.35) return 'var(--heatmap-2)';
  if (ratio < 0.65) return 'var(--heatmap-3)';
  return 'var(--heatmap-4)';
}

export function PeakHoursWidget({ data }: PeakHoursWidgetProps) {
  // Build a lookup map: key = "dayOfWeek-hour" => sessions
  const sessionMap = new Map<string, number>();
  let maxSessions = 0;

  for (const item of data) {
    const key = `${item.day_of_week}-${item.hour}`;
    sessionMap.set(key, item.sessions);
    if (item.sessions > maxSessions) {
      maxSessions = item.sessions;
    }
  }

  return (
    <div className="w-full h-full overflow-auto" style={{ padding: '8px' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '48px repeat(7, 1fr)',
          gridTemplateRows: 'auto repeat(24, 1fr)',
          gap: '2px',
          width: '100%',
          height: '100%',
          minHeight: '400px',
        }}
      >
        {/* Top-left empty cell */}
        <div />

        {/* Day labels across the top */}
        {DAY_LABELS.map((day) => (
          <div
            key={day}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 500,
              color: 'var(--text-secondary)',
              paddingBottom: '4px',
            }}
          >
            {day}
          </div>
        ))}

        {/* Hour rows */}
        {Array.from({ length: 24 }, (_, hour) => (
          <div key={`row-${hour}`} style={{ display: 'contents' }}>
            {/* Hour label */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                fontSize: '10px',
                color: 'var(--text-secondary)',
                paddingRight: '6px',
              }}
            >
              {formatHour(hour)}
            </div>

            {/* Cells for each day */}
            {GA4_DAY_ORDER.map((ga4Day, dayIdx) => {
              const sessions = sessionMap.get(`${ga4Day}-${hour}`) ?? 0;
              return (
                <div
                  key={`${hour}-${dayIdx}`}
                  title={`${DAY_LABELS[dayIdx]} ${formatHour(hour)}: ${sessions.toLocaleString()} sessions`}
                  style={{
                    backgroundColor: getCellColor(sessions, maxSessions),
                    borderRadius: '2px',
                    minHeight: '12px',
                    cursor: 'default',
                    transition: 'opacity 0.15s',
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
