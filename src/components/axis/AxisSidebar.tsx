/**
 * AxisSidebar Component
 *
 * The main vertical navigation sidebar for the dashboard.
 * Replaces the horizontal Level 1 (main sections) and Level 2 (subsections)
 * tab bars with a collapsible vertical menu.
 *
 * Three zones:
 * - Top: Logo + collapse toggle
 * - Middle: Navigation items (scrollable)
 * - Bottom: Settings / utility links
 *
 * USAGE:
 * <AxisSidebar
 *   collapsed={false}
 *   onToggleCollapse={toggle}
 *   activeSection="analytics"
 *   activeSubsection="8020rei-ga4"
 *   onSectionChange={(section) => ...}
 *   onSubsectionChange={(section, sub) => ...}
 * />
 */

'use client';

import { Logo } from '@/components/Logo';
import { MAIN_SECTION_TABS, SUBSECTION_TABS_MAP } from '@/lib/navigation';
import { SIDEBAR_ICONS } from '@/lib/sidebarIcons';
import { AxisSidebarItem } from './AxisSidebarItem';
import { AxisSidebarSection } from './AxisSidebarSection';
import { AxisTooltip } from './AxisTooltip';

export interface AxisSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  activeSection: string;
  activeSubsection: string;
  onSectionChange: (section: string) => void;
  onSubsectionChange: (section: string, subsection: string) => void;
}

const CollapseIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
  </svg>
);

const ExpandIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
);

export function AxisSidebar({
  collapsed,
  onToggleCollapse,
  activeSection,
  activeSubsection,
  onSectionChange,
  onSubsectionChange,
}: AxisSidebarProps) {
  return (
    <aside
      role="navigation"
      aria-label="Main navigation"
      className={`h-full flex flex-col border-r border-stroke chrome-bg sidebar-transition flex-shrink-0 ${
        collapsed ? 'w-14' : 'w-60'
      }`}
    >
      {/* Top zone: Logo + collapse toggle */}
      <div className={`flex items-center flex-shrink-0 border-b border-stroke ${
        collapsed ? 'justify-center px-2 h-14' : 'justify-between px-4 h-14'
      }`}>
        {!collapsed && <Logo className="h-5 w-auto" />}
        {collapsed ? (
          <AxisTooltip content="Expand menu" placement="right">
            <button
              type="button"
              onClick={onToggleCollapse}
              className="flex items-center justify-center w-8 h-8 rounded-md text-content-secondary hover:bg-surface-raised transition-colors"
              aria-label="Expand sidebar"
            >
              <ExpandIcon />
            </button>
          </AxisTooltip>
        ) : (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="flex items-center justify-center w-8 h-8 rounded-md text-content-secondary hover:bg-surface-raised transition-colors"
            aria-label="Collapse sidebar"
          >
            <CollapseIcon />
          </button>
        )}
      </div>

      {/* Middle zone: Navigation items (scrollable) */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 space-y-0.5" role="menu">
        <div className={collapsed ? 'px-1 space-y-1' : 'px-2 space-y-0.5'}>
          {MAIN_SECTION_TABS.map(section => {
            const subsections = SUBSECTION_TABS_MAP[section.id];
            const icon = SIDEBAR_ICONS[section.id] || <span className="w-5 h-5" />;

            // Section has subsections → render collapsible group
            if (subsections && subsections.length > 0) {
              return (
                <AxisSidebarSection
                  key={section.id}
                  section={section}
                  subsections={subsections}
                  icon={icon}
                  activeSection={activeSection}
                  activeSubsection={activeSubsection}
                  collapsed={collapsed}
                  onSubsectionClick={onSubsectionChange}
                />
              );
            }

            // Simple section without subsections
            return (
              <AxisSidebarItem
                key={section.id}
                id={section.id}
                label={section.name}
                icon={icon}
                active={activeSection === section.id}
                disabled={section.disabled}
                collapsed={collapsed}
                onClick={() => onSectionChange(section.id)}
              />
            );
          })}
        </div>
      </nav>

      {/* Bottom zone: Version / branding */}
      <div className={`flex-shrink-0 border-t border-stroke py-3 ${
        collapsed ? 'px-2 text-center' : 'px-4'
      }`}>
        {!collapsed && (
          <span className="text-xs text-content-tertiary">Metrics Hub v1.0</span>
        )}
      </div>
    </aside>
  );
}
