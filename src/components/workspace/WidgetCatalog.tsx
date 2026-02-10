/**
 * Widget Catalog Component
 *
 * Modal dialog for selecting and adding new widgets to the workspace.
 * Now accepts a catalog prop to support tab-specific widget catalogs.
 */

'use client';

import { Widget } from '@/types/widget';
import { WidgetCatalogItem, IconKey, OVERVIEW_WIDGET_CATALOG } from '@/lib/workspace/defaultLayouts';

/**
 * Widget Icons Registry
 *
 * Maps icon keys to SVG components for rendering in the catalog.
 */
const WIDGET_ICONS: Record<IconKey, React.ReactNode> = {
  // Grid icon - for metrics/overview widgets
  grid: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
    </svg>
  ),
  // Line chart icon - for time series widgets
  lineChart: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
    </svg>
  ),
  // Bar chart icon - for bar chart widgets
  barChart: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  // Table icon - for table widgets
  table: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
  // Donut/pie chart icon - for distribution widgets
  donutChart: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
    </svg>
  ),
  // Users icon - for user-related widgets
  users: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  // Globe icon - for geography widgets
  globe: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  // Device icon - for technology widgets
  device: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  // Traffic icon - for traffic widgets
  traffic: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  // Events icon - for events widgets
  events: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  // Alert/insight icon - for insights widgets
  alert: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  // Building icon - for clients
  building: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
};

interface WidgetCatalogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddWidget: (type: Widget['type'], title: string, size: { w: number; h: number }) => void;
  existingWidgets: Widget[];
  /** Optional catalog - defaults to OVERVIEW_WIDGET_CATALOG for backwards compatibility */
  catalog?: WidgetCatalogItem[];
}

export function WidgetCatalog({
  isOpen,
  onClose,
  onAddWidget,
  existingWidgets,
  catalog = OVERVIEW_WIDGET_CATALOG,
}: WidgetCatalogProps) {
  if (!isOpen) return null;

  const handleAddWidget = (item: WidgetCatalogItem) => {
    onAddWidget(item.type, item.title, item.defaultSize);
    onClose();
  };

  // Check if a widget type already exists
  const isWidgetTypeUsed = (type: Widget['type']) => {
    return existingWidgets.some((w) => w.type === type);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-surface-base border border-stroke rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stroke bg-surface-raised flex-shrink-0">
          <h2 className="text-h3 font-semibold text-content-primary">Add Widget</h2>
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

        {/* Content - Scrollable */}
        <div className="p-6 overflow-y-auto flex-1">
          <p className="text-body-regular text-content-secondary mb-4">
            Select a widget to add to your workspace.
          </p>

          <div className="space-y-3">
            {catalog.map((item) => {
              const isUsed = isWidgetTypeUsed(item.type);
              const icon = WIDGET_ICONS[item.iconKey];
              return (
                <button
                  key={item.type}
                  onClick={() => !isUsed && handleAddWidget(item)}
                  disabled={isUsed}
                  className={[
                    'w-full flex items-start gap-4 p-4 rounded-lg border transition-all duration-200 text-left',
                    isUsed
                      ? 'border-stroke bg-surface-base opacity-50 cursor-not-allowed'
                      : 'border-stroke hover:border-main-500 hover:bg-surface-raised cursor-pointer',
                  ].join(' ')}
                >
                  {/* Icon */}
                  <div className={[
                    'flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center',
                    isUsed
                      ? 'bg-surface-raised text-content-tertiary'
                      : 'bg-main-50 dark:bg-main-950 text-main-700 dark:text-main-400',
                  ].join(' ')}>
                    {icon}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-body-large font-semibold text-content-primary">
                        {item.title}
                      </h3>
                      {isUsed && (
                        <span className="text-label text-content-tertiary bg-surface-raised px-2 py-0.5 rounded">
                          Already added
                        </span>
                      )}
                    </div>
                    <p className="text-body-regular text-content-secondary mt-1">
                      {item.description}
                    </p>
                  </div>

                  {/* Add icon */}
                  {!isUsed && (
                    <div className="flex-shrink-0 text-main-600 dark:text-main-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
