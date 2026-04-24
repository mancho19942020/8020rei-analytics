/**
 * Auto Export Config Health Widget
 *
 * Three data-quality counters from the latest config snapshot:
 *   - orphaned: configs whose configured_filter_id has been deleted
 *   - never_run: configs that have never produced a log row
 *   - stale: active configs with no successful run in 60 days
 *
 * Rendered as compact cards side-by-side. Clicking a card is out of scope
 * for MVP (future: filter the Recent runs widget).
 */

'use client';

import type { AutoExportConfigHealth } from '@/types/auto-export';

interface AutoExportConfigHealthWidgetProps {
  data: AutoExportConfigHealth;
}

interface Counter {
  label: string;
  value: number;
  description: string;
  tone: 'neutral' | 'warning' | 'alert';
}

function toneClasses(tone: Counter['tone']): { border: string; value: string } {
  switch (tone) {
    case 'alert':
      return { border: 'border-error-300 dark:border-error-700', value: 'text-error-600 dark:text-error-400' };
    case 'warning':
      return { border: 'border-alert-300 dark:border-alert-700', value: 'text-alert-600 dark:text-alert-400' };
    default:
      return { border: 'border-stroke', value: 'text-content-primary' };
  }
}

export function AutoExportConfigHealthWidget({ data }: AutoExportConfigHealthWidgetProps) {
  const counters: Counter[] = [
    {
      label: 'Orphaned',
      value: data.orphaned,
      description: 'Filter deleted but config still active',
      tone: data.orphaned > 0 ? 'alert' : 'neutral',
    },
    {
      label: 'Never run',
      value: data.neverRun,
      description: 'Created but has no log entries',
      tone: data.neverRun > 0 ? 'warning' : 'neutral',
    },
    {
      label: 'Stale (60d)',
      value: data.stale,
      description: 'Active but no successful run in 60 days',
      tone: data.stale > 0 ? 'warning' : 'neutral',
    },
  ];

  return (
    <div className="h-full w-full p-3 flex flex-col gap-3">
      {counters.map((c) => {
        const cls = toneClasses(c.tone);
        return (
          <div
            key={c.label}
            className={`flex items-center justify-between gap-3 rounded-lg border ${cls.border} px-4 py-3`}
          >
            <div className="flex flex-col">
              <span className="text-sm font-medium text-content-primary">{c.label}</span>
              <span className="text-xs text-content-secondary">{c.description}</span>
            </div>
            <span className={`text-2xl font-semibold tabular-nums ${cls.value}`}>
              {c.value.toLocaleString()}
            </span>
          </div>
        );
      })}
    </div>
  );
}
