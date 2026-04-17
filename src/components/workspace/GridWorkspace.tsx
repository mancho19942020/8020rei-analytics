/**
 * Grid Workspace Component
 *
 * Main container for the grid-based workspace system.
 * Uses react-grid-layout for drag-and-drop and resizing functionality.
 */

'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { ResponsiveGridLayout, Layout, LayoutItem } from 'react-grid-layout';
import { Widget } from './Widget';
import { Widget as WidgetConfig, WidgetType } from '@/types/widget';
import { GRID_CONFIG } from '@/lib/workspace/defaultLayouts';

// Import react-grid-layout CSS
import 'react-grid-layout/css/styles.css';

/**
 * Legacy flush-body registry — DEPRECATED, prefer `flushBody: true` in widget layout config.
 *
 * When adding a new widget that needs edge-to-edge content (metric cards, pill grids),
 * set `flushBody: true` on the widget definition in defaultLayouts.ts instead of adding here.
 * This Set is kept only for backward compatibility with widgets that don't yet have the flag.
 */
const FLUSH_BODY_WIDGETS_LEGACY = new Set<WidgetType>([
  'metrics',
  'engagement-metrics',
  'event-metrics',
  'clients-overview',
  'project-status-overview',
  'api-overview',
  'domain-activity-overview',
  'user-activity',
  'session-summary',
  'device-category',
  'insights-summary',
  'rr-system-coverage',
  'rr-data-integrity',
  'pa-active-users',
  'asana-board-overview',
  'asana-bugs-overview',
  'pcm-margin-summary',
  'pcm-margin-period',
  'pcm-reconciliation-overview',
  'rr-operational-pulse',
  'rr-quality-metrics',
  'rr-pcm-health',
]);

export interface GridWorkspaceProps {
  /** Widget configurations */
  layout: WidgetConfig[];

  /** Callback when layout changes */
  onLayoutChange?: (layout: WidgetConfig[]) => void;

  /** Whether workspace is in edit mode */
  editMode?: boolean;

  /** Widget components mapped by widget type */
  widgets: Record<string, React.ReactNode>;

  /** Extra header content mapped by widget type (rendered in widget header bar) */
  headerExtras?: Record<string, React.ReactNode>;

  /** Callback when widget settings button is clicked */
  onWidgetSettings?: (widgetId: string) => void;

  /** Callback when widget export button is clicked */
  onWidgetExport?: (widgetId: string) => void;
}

export function GridWorkspace({
  layout,
  onLayoutChange,
  editMode = false,
  widgets,
  headerExtras,
  onWidgetSettings,
  onWidgetExport,
}: GridWorkspaceProps) {
  const [currentLayout, setCurrentLayout] = useState<WidgetConfig[]>(layout);
  const [width, setWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Refs to avoid re-render cycles — breakpoint and callback are read in the
  // RGL event handler but should never cause it to be recreated.
  const breakpointRef = useRef('lg');
  const onLayoutChangeRef = useRef(onLayoutChange);
  useEffect(() => { onLayoutChangeRef.current = onLayoutChange; }, [onLayoutChange]);

  // Guard flag: when we set currentLayout from handleLayoutChange and the parent
  // echoes it back via the layout prop, we must NOT re-set state or we loop.
  const selfUpdateRef = useRef(false);

  // Sync layout from parent prop (e.g., reset button), but skip if we just
  // pushed this exact update ourselves via handleLayoutChange.
  useEffect(() => {
    if (selfUpdateRef.current) {
      selfUpdateRef.current = false;
      return;
    }
    setCurrentLayout(layout);
  }, [layout]);

  // Measure container width
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width);
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Convert widget configs to react-grid-layout format — pass positions through
  // directly for the lg breakpoint; RGL handles clamping for smaller breakpoints.
  const rglLayouts = useMemo(() => {
    const layoutByBreakpoint: Record<string, Layout> = {};

    Object.keys(GRID_CONFIG.cols).forEach((breakpoint) => {
      layoutByBreakpoint[breakpoint] = currentLayout.map((widget): LayoutItem => ({
        i: widget.id,
        x: widget.x,
        y: widget.y,
        w: widget.w,
        h: widget.h,
        minW: widget.minW,
        minH: widget.minH,
        maxW: widget.maxW,
        maxH: widget.maxH,
        static: widget.static || !editMode,
      }));
    });

    return layoutByBreakpoint;
  }, [currentLayout, editMode]);

  // Handle layout change from react-grid-layout.
  // Stable function (no useCallback needed) — reads from refs, not state.
  const handleLayoutChange = (_currentLayout: Layout, allLayouts: Partial<Record<string, Layout>>) => {
    // Only persist from the lg breakpoint to prevent layout corruption
    if (breakpointRef.current !== 'lg') return;

    const lgLayout = allLayouts.lg;
    if (!lgLayout) return;

    setCurrentLayout((prev) => {
      let changed = false;
      const updatedLayout = prev.map((widget) => {
        const rglWidget = lgLayout.find((item) => item.i === widget.id);
        if (!rglWidget) return widget;

        if (widget.x === rglWidget.x && widget.y === rglWidget.y &&
            widget.w === rglWidget.w && widget.h === rglWidget.h) {
          return widget;
        }

        changed = true;
        return { ...widget, x: rglWidget.x, y: rglWidget.y, w: rglWidget.w, h: rglWidget.h };
      });

      if (!changed) return prev;

      // Mark that we are the source of this update so the sync effect skips it
      selfUpdateRef.current = true;
      // Notify parent asynchronously to avoid setState-during-render
      const cb = onLayoutChangeRef.current;
      setTimeout(() => cb?.(updatedLayout), 0);
      return updatedLayout;
    });
  };

  const handleBreakpointChange = (bp: string) => {
    breakpointRef.current = bp;
  };

  // Handle widget removal
  const handleRemoveWidget = (widgetId: string) => {
    const updatedLayout = currentLayout.filter((w) => w.id !== widgetId);
    setCurrentLayout(updatedLayout);
    onLayoutChange?.(updatedLayout);
  };

  return (
    <div ref={containerRef} className="w-full">
      {width > 0 && (
      <ResponsiveGridLayout
        layouts={rglLayouts}
        breakpoints={GRID_CONFIG.breakpoints}
        cols={GRID_CONFIG.cols}
        rowHeight={GRID_CONFIG.rowHeight}
        width={width}
        margin={GRID_CONFIG.margin}
        containerPadding={GRID_CONFIG.containerPadding}
        onLayoutChange={handleLayoutChange}
        onBreakpointChange={handleBreakpointChange}
        {...({
          draggableHandle: '.widget-drag-handle',
          ...(editMode ? { resizeHandles: ['se', 'e', 's'] } : {}),
        } as Record<string, unknown>)}
      >
        {currentLayout.map((widgetConfig) => (
          <div key={widgetConfig.id} className="transition-shadow duration-200">
            <Widget
              title={widgetConfig.title}
              tooltip={widgetConfig.tooltip}
              headerExtra={headerExtras?.[widgetConfig.type]}
              editMode={editMode}
              flushBody={widgetConfig.flushBody ?? FLUSH_BODY_WIDGETS_LEGACY.has(widgetConfig.type)}
              timeScope={
                widgetConfig.timeBehavior === 'all-time'
                  ? 'all-time'
                  : widgetConfig.timeBehavior === 'date-filtered'
                    ? 'date-range'
                    : widgetConfig.timeBehavior === 'last-30-days'
                      ? 'last-30-days'
                      : 'none'
              }
              onRemove={() => handleRemoveWidget(widgetConfig.id)}
              onSettings={onWidgetSettings ? () => onWidgetSettings(widgetConfig.id) : undefined}
              onExport={onWidgetExport ? () => onWidgetExport(widgetConfig.id) : undefined}
            >
              {widgets[widgetConfig.type] || (
                <div className="flex items-center justify-center h-full text-content-tertiary">
                  Widget not found: {widgetConfig.type}
                </div>
              )}
            </Widget>
          </div>
        ))}
      </ResponsiveGridLayout>
      )}
    </div>
  );
}
