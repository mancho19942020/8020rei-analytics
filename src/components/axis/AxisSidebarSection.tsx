/**
 * AxisSidebarSection Component
 *
 * A collapsible group in the sidebar for sections that have subsections.
 *
 * EXPANDED sidebar: Shows a header row (section name + chevron) that toggles
 * child items inline. Auto-expands when the section is active.
 *
 * COLLAPSED sidebar: Shows only the icon. On hover, a flyout popover appears
 * to the right showing the section name as header + all subsections as
 * clickable items. Uses a portal with mouseEnter/mouseLeave coordination
 * between the icon and the flyout to keep it open while moving between them.
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AxisSidebarItem } from './AxisSidebarItem';

export interface SidebarSectionTab {
  id: string;
  name: string;
  disabled?: boolean;
}

export interface AxisSidebarSectionProps {
  section: SidebarSectionTab;
  subsections: SidebarSectionTab[];
  icon: ReactNode;
  activeSection: string;
  activeSubsection: string;
  collapsed: boolean;
  onSubsectionClick: (sectionId: string, subsectionId: string) => void;
}

const ChevronIcon = ({ expanded }: { expanded: boolean }) => (
  <svg
    className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
  </svg>
);

/**
 * Flyout popover for collapsed sidebar — appears to the right of the icon.
 * Rendered via portal into document.body. Includes a thin invisible bridge
 * between the sidebar edge and the flyout panel so the mouse can travel
 * across the gap without triggering a close.
 */
function SidebarFlyout({
  section,
  subsections,
  activeSection,
  activeSubsection,
  anchorRect,
  onSubsectionClick,
  onMouseEnter,
  onMouseLeave,
}: {
  section: SidebarSectionTab;
  subsections: SidebarSectionTab[];
  activeSection: string;
  activeSubsection: string;
  anchorRect: DOMRect;
  onSubsectionClick: (sectionId: string, subsectionId: string) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const isActive = activeSection === section.id;

  // Position the flyout to the right of the icon with a small bridge gap
  const BRIDGE_WIDTH = 8;
  const flyoutLeft = anchorRect.right + BRIDGE_WIDTH;
  const flyoutTop = anchorRect.top - 4;

  return createPortal(
    <>
      {/* Invisible bridge — thin horizontal strip connecting icon edge to flyout */}
      <div
        style={{
          position: 'fixed',
          left: anchorRect.right,
          top: anchorRect.top,
          width: BRIDGE_WIDTH,
          height: anchorRect.height,
          zIndex: 50,
        }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      />

      {/* Flyout panel */}
      <div
        style={{
          position: 'fixed',
          left: flyoutLeft,
          top: flyoutTop,
          zIndex: 50,
        }}
        className="sidebar-flyout min-w-[180px] max-w-[220px] rounded-lg border border-stroke shadow-lg py-1.5 bg-surface-base"
        role="menu"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {/* Section header */}
        <div className="px-3 py-1.5 text-xs font-semibold text-content-tertiary uppercase tracking-wider">
          {section.name}
        </div>

        {/* Subsection items */}
        <div className="px-1.5 space-y-0.5">
          {subsections.map(sub => (
            <button
              key={sub.id}
              type="button"
              role="menuitem"
              disabled={sub.disabled}
              onClick={() => {
                if (!sub.disabled) {
                  onSubsectionClick(section.id, sub.id);
                }
              }}
              className={`w-full text-left px-2.5 py-1.5 text-sm rounded-md transition-colors duration-150 ${
                sub.disabled
                  ? 'opacity-40 cursor-not-allowed text-content-disabled'
                  : isActive && activeSubsection === sub.id
                    ? 'sidebar-item-active font-medium'
                    : 'text-content-secondary hover:bg-surface-raised hover:text-content-primary cursor-pointer'
              }`}
            >
              {sub.name}
            </button>
          ))}
        </div>
      </div>
    </>,
    document.body,
  );
}

export function AxisSidebarSection({
  section,
  subsections,
  icon,
  activeSection,
  activeSubsection,
  collapsed,
  onSubsectionClick,
}: AxisSidebarSectionProps) {
  const isActive = activeSection === section.id;
  const [expanded, setExpanded] = useState(isActive);
  const [flyoutOpen, setFlyoutOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const iconRef = useRef<HTMLButtonElement>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-expand when this section becomes active
  useEffect(() => {
    if (isActive) setExpanded(() => true);
  }, [isActive]);

  // Close flyout when sidebar expands
  useEffect(() => {
    if (!collapsed) setFlyoutOpen(() => false);
  }, [collapsed]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  const cancelClose = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimeoutRef.current = setTimeout(() => {
      setFlyoutOpen(false);
    }, 80);
  }, [cancelClose]);

  const openFlyout = useCallback(() => {
    cancelClose();
    if (iconRef.current) {
      setAnchorRect(iconRef.current.getBoundingClientRect());
      setFlyoutOpen(true);
    }
  }, [cancelClose]);

  // In collapsed sidebar mode: icon with flyout popover on hover
  if (collapsed) {
    return (
      <div className="relative">
        <button
          ref={iconRef}
          type="button"
          role="menuitem"
          aria-current={isActive ? 'page' : undefined}
          aria-haspopup="true"
          aria-expanded={flyoutOpen}
          onMouseEnter={openFlyout}
          onMouseLeave={scheduleClose}
          onClick={openFlyout}
          className={`flex items-center justify-center w-10 h-8 rounded-md mx-auto cursor-pointer transition-colors duration-150 ${
            isActive ? 'sidebar-item-active font-medium' : 'text-content-secondary hover:bg-surface-raised'
          }`}
        >
          <span className="flex-shrink-0">{icon}</span>
        </button>

        {flyoutOpen && anchorRect && (
          <SidebarFlyout
            section={section}
            subsections={subsections}
            activeSection={activeSection}
            activeSubsection={activeSubsection}
            anchorRect={anchorRect}
            onSubsectionClick={(sId, subId) => {
              onSubsectionClick(sId, subId);
              setFlyoutOpen(false);
            }}
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
          />
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Section header — click toggles expand */}
      <button
        type="button"
        role="menuitem"
        onClick={() => setExpanded(prev => !prev)}
        className={`flex items-center gap-3 w-full h-8 px-3 rounded-md cursor-pointer select-none transition-colors duration-150 ${
          isActive ? 'text-content-primary font-medium' : 'text-content-secondary hover:bg-surface-raised'
        }`}
      >
        <span className="flex-shrink-0">{icon}</span>
        <span className="truncate text-sm leading-5">{section.name}</span>
        <span className="ml-auto">
          <ChevronIcon expanded={expanded} />
        </span>
      </button>

      {/* Subsection children */}
      {expanded && (
        <div className="mt-0.5 space-y-0.5">
          {subsections.map(sub => (
            <AxisSidebarItem
              key={sub.id}
              id={sub.id}
              label={sub.name}
              icon={<span className="w-5 h-5" />}
              active={isActive && activeSubsection === sub.id}
              disabled={sub.disabled}
              indent
              onClick={() => onSubsectionClick(section.id, sub.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
