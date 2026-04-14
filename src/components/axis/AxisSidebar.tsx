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
  /** Section IDs to hide from the sidebar (e.g., access-controlled sections) */
  hiddenSections?: Set<string>;
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
  hiddenSections,
}: AxisSidebarProps) {
  const visibleSections = hiddenSections
    ? MAIN_SECTION_TABS.filter(s => !hiddenSections.has(s.id))
    : MAIN_SECTION_TABS;
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
          {visibleSections.map(section => {
            const subsections = SUBSECTION_TABS_MAP[section.id];
            const icon = SIDEBAR_ICONS[section.id] || <span className="w-5 h-5" />;

            // Section has subsections and is not fully disabled → render collapsible group
            if (subsections && subsections.length > 0 && !section.disabled) {
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

            // Simple section or fully disabled section
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

      {/* Bottom zone: Company switcher + version */}
      <div className={`flex-shrink-0 border-t border-stroke ${
        collapsed ? 'px-2 py-2' : 'px-3 py-2'
      }`}>
        {/* Company switcher — disabled until 8020Roofing has data */}
        {collapsed ? (
          <AxisTooltip content="8020REI (switch disabled)" placement="right">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-surface-raised mx-auto">
              <span className="text-xs font-bold" style={{ color: 'var(--color-main-500)' }}>REI</span>
            </div>
          </AxisTooltip>
        ) : (
          <div
            className="flex items-center gap-3 px-3 py-2 rounded-lg bg-surface-raised"
            style={{ opacity: 1 }}
          >
            <div
              className="flex items-center justify-center w-8 h-8 rounded-md flex-shrink-0"
              style={{ backgroundColor: 'var(--color-main-100)', color: 'var(--color-main-700)' }}
            >
              <span className="text-xs font-bold">REI</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>8020REI</div>
              <div className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>Active workspace</div>
            </div>
            <AxisTooltip content="Company switching coming soon" placement="top">
              <svg className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
              </svg>
            </AxisTooltip>
          </div>
        )}
        {!collapsed && (
          <div className="mt-2 px-1">
            <span className="text-[10px] text-content-tertiary">Metrics Hub v1.0</span>
          </div>
        )}
      </div>
    </aside>
  );
}
