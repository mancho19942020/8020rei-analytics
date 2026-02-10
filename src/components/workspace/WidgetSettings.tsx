/**
 * Widget Settings Component
 *
 * Modal dialog for configuring individual widget settings.
 */

'use client';

import { useState, useEffect } from 'react';
import { Widget } from '@/types/widget';

const TIME_RANGE_OPTIONS = [
  { value: 'global', label: 'Use Global Filter' },
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
];

interface WidgetSettingsProps {
  widget: Widget | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (widgetId: string, updates: Partial<Widget>) => void;
  onDelete: (widgetId: string) => void;
}

export function WidgetSettings({ widget, isOpen, onClose, onSave, onDelete }: WidgetSettingsProps) {
  const [title, setTitle] = useState('');
  const [timeRange, setTimeRange] = useState('global');

  // Reset form when widget changes
  useEffect(() => {
    if (widget) {
      setTitle(widget.title);
      setTimeRange(widget.config?.timeRange || 'global');
    }
  }, [widget]);

  if (!isOpen || !widget) return null;

  const handleSave = () => {
    onSave(widget.id, {
      title,
      config: {
        ...widget.config,
        timeRange,
      },
    });
    onClose();
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to remove this widget?')) {
      onDelete(widget.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-surface-base border border-stroke rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stroke bg-surface-raised">
          <h2 className="text-h3 font-semibold text-content-primary">Widget Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-base rounded-lg transition-colors duration-150 text-content-secondary hover:text-content-primary"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Title Input */}
          <div>
            <label htmlFor="widget-title" className="block text-label font-medium text-content-secondary mb-2">
              Widget Title
            </label>
            <input
              id="widget-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-surface-raised border border-stroke rounded-lg text-content-primary placeholder:text-content-tertiary focus:outline-none focus:border-main-500 focus:ring-1 focus:ring-main-500 transition-colors duration-200"
              placeholder="Enter widget title"
            />
          </div>

          {/* Time Range Select */}
          <div>
            <label htmlFor="widget-timerange" className="block text-label font-medium text-content-secondary mb-2">
              Time Range
            </label>
            <select
              id="widget-timerange"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="w-full px-4 py-2.5 bg-surface-raised border border-stroke rounded-lg text-content-primary focus:outline-none focus:border-main-500 focus:ring-1 focus:ring-main-500 transition-colors duration-200"
            >
              {TIME_RANGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-label text-content-tertiary">
              Override the global time filter for this widget only.
            </p>
          </div>

          {/* Widget Type Info */}
          <div>
            <label className="block text-label font-medium text-content-secondary mb-2">
              Widget Type
            </label>
            <p className="text-body-regular text-content-primary capitalize">
              {widget.type === 'metrics' && 'Key Metrics (2×2 Grid)'}
              {widget.type === 'timeseries' && 'Time Series Chart'}
              {widget.type === 'barchart' && 'Bar Chart'}
              {widget.type === 'table' && 'Data Table'}
            </p>
          </div>

          {/* Size Info */}
          <div>
            <label className="block text-label font-medium text-content-secondary mb-2">
              Current Size
            </label>
            <p className="text-body-regular text-content-primary">
              {widget.w} columns × {widget.h} rows
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-stroke bg-surface-raised">
          {/* Delete Button */}
          <button
            onClick={handleDelete}
            className="px-4 py-2 text-sm text-error-600 hover:text-error-700 dark:text-error-400 dark:hover:text-error-300 hover:bg-error-50 dark:hover:bg-error-950 rounded-lg transition-colors duration-200 font-medium"
          >
            Remove Widget
          </button>

          {/* Save/Cancel */}
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm bg-surface-base border border-stroke text-content-secondary hover:bg-surface-raised hover:text-content-primary hover:border-stroke-strong rounded-lg transition-colors duration-200 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm bg-main-600 hover:bg-main-700 text-white rounded-lg transition-colors duration-200 font-medium"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
