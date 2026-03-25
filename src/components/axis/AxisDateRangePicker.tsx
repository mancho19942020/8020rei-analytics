/**
 * AxisDateRangePicker Component
 *
 * A date range picker that supports preset ranges (7d, 14d, 30d, 90d)
 * and custom date range selection. Follows Axis design system.
 *
 * USAGE:
 * <AxisDateRangePicker
 *   value={dateRange}
 *   onChange={setDateRange}
 *   size="sm"
 * />
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';

export type DateRangeValue =
  | { type: 'preset'; days: number }
  | { type: 'custom'; startDate: string; endDate: string };

export interface AxisDateRangePickerProps {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const presets = [
  { label: '7 days', days: 7 },
  { label: '14 days', days: 14 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
];

const sizeClasses = {
  sm: 'h-7 text-xs px-2.5',
  md: 'h-9 text-sm px-3',
  lg: 'h-11 text-sm px-3.5',
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getISODate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

export function AxisDateRangePicker({
  value,
  onChange,
  size = 'md',
  className = '',
}: AxisDateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const label =
    value.type === 'preset'
      ? `Last ${value.days} days`
      : `${formatDate(value.startDate)} – ${formatDate(value.endDate)}`;

  const activeDays = value.type === 'preset' ? value.days : null;

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`${sizeClasses[size]} inline-flex items-center gap-1.5 rounded-md border border-[var(--border-default)] bg-[var(--surface-base)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] transition-colors cursor-pointer`}
      >
        <svg className="w-3.5 h-3.5 flex-shrink-0 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="whitespace-nowrap">{label}</span>
        <svg className={`w-3 h-3 flex-shrink-0 opacity-50 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-56 rounded-lg border border-[var(--border-default)] bg-[var(--surface-base)] shadow-lg overflow-hidden">
          {/* Presets */}
          <div className="p-1.5">
            <div className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
              Presets
            </div>
            {presets.map((p) => (
              <button
                key={p.days}
                type="button"
                onClick={() => {
                  onChange({ type: 'preset', days: p.days });
                  setOpen(false);
                }}
                className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors cursor-pointer ${
                  activeDays === p.days
                    ? 'bg-[var(--color-main-500)] text-white'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--surface-raised)]'
                }`}
              >
                Last {p.label}
              </button>
            ))}
          </div>

          {/* Custom range */}
          <div className="border-t border-[var(--border-subtle)] p-2">
            <div className="px-1 pb-1.5 text-[10px] font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
              Custom Range
            </div>
            <div className="flex gap-2">
              <input
                type="date"
                className="flex-1 h-7 px-1.5 text-xs rounded border border-[var(--border-default)] bg-[var(--surface-base)] text-[var(--text-primary)]"
                defaultValue={value.type === 'custom' ? value.startDate : getISODate(30)}
                max={getISODate(0)}
                onChange={(e) => {
                  const start = e.target.value;
                  const end = value.type === 'custom' ? value.endDate : getISODate(0);
                  if (start && end) {
                    onChange({ type: 'custom', startDate: start, endDate: end });
                  }
                }}
              />
              <input
                type="date"
                className="flex-1 h-7 px-1.5 text-xs rounded border border-[var(--border-default)] bg-[var(--surface-base)] text-[var(--text-primary)]"
                defaultValue={value.type === 'custom' ? value.endDate : getISODate(0)}
                max={getISODate(0)}
                onChange={(e) => {
                  const end = e.target.value;
                  const start = value.type === 'custom' ? value.startDate : getISODate(30);
                  if (start && end) {
                    onChange({ type: 'custom', startDate: start, endDate: end });
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
