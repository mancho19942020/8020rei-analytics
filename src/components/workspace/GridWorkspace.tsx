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
import { Widget as WidgetConfig } from '@/types/widget';
import { GRID_CONFIG } from '@/lib/workspace/defaultLayouts';

// Import react-grid-layout CSS
import 'react-grid-layout/css/styles.css';

export interface GridWorkspaceProps {
  /** Widget configurations */
  layout: WidgetConfig[];

  /** Callback when layout changes */
  onLayoutChange?: (layout: WidgetConfig[]) => void;

  /** Whether workspace is in edit mode */
  editMode?: boolean;

  /** Widget components mapped by widget ID */
  widgets: Record<string, React.ReactNode>;

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
  onWidgetSettings,
  onWidgetExport,
}: GridWorkspaceProps) {
  const [currentLayout, setCurrentLayout] = useState<WidgetConfig[]>(layout);
  const [width, setWidth] = useState(1200);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync layout when prop changes (e.g., reset)
  useEffect(() => {
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

  // Convert widget configs to react-grid-layout format
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

  // Handle layout change from react-grid-layout
  const handleLayoutChange = (_currentLayout: Layout, allLayouts: Partial<Record<string, Layout>>) => {
    // Use the 'lg' (large) breakpoint as the source of truth
    const lgLayout = Array.from(allLayouts.lg || _currentLayout);

    // Update widget configs with new positions
    const updatedLayout = currentLayout.map((widget) => {
      const rglWidget = lgLayout.find((item) => item.i === widget.id);
      if (!rglWidget) return widget;

      return {
        ...widget,
        x: rglWidget.x,
        y: rglWidget.y,
        w: rglWidget.w,
        h: rglWidget.h,
      };
    });

    setCurrentLayout(updatedLayout);
    onLayoutChange?.(updatedLayout);
  };

  // Handle widget removal
  const handleRemoveWidget = (widgetId: string) => {
    const updatedLayout = currentLayout.filter((w) => w.id !== widgetId);
    setCurrentLayout(updatedLayout);
    onLayoutChange?.(updatedLayout);
  };

  return (
    <div ref={containerRef} className="w-full">
      <ResponsiveGridLayout
        layouts={rglLayouts}
        breakpoints={GRID_CONFIG.breakpoints}
        cols={GRID_CONFIG.cols}
        rowHeight={GRID_CONFIG.rowHeight}
        width={width}
        margin={GRID_CONFIG.margin}
        containerPadding={GRID_CONFIG.containerPadding}
        onLayoutChange={handleLayoutChange}
        {...({
          draggableHandle: '.widget-drag-handle',
          ...(editMode ? { resizeHandles: ['se', 'e', 's'] } : {}),
        } as Record<string, unknown>)}
      >
        {currentLayout.map((widgetConfig) => (
          <div key={widgetConfig.id} className="transition-shadow duration-200">
            <Widget
              title={widgetConfig.title}
              editMode={editMode}
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
    </div>
  );
}
