/**
 * AxisSidebarItem Component
 *
 * An individual navigation item for the sidebar menu.
 * Supports active state, disabled state, collapsed (icon-only) mode,
 * indented variant for subsection children, and optional badge.
 *
 * USAGE:
 * <AxisSidebarItem
 *   id="analytics"
 *   label="Analytics"
 *   icon={<ChartIcon />}
 *   active
 *   onClick={() => navigate('analytics')}
 * />
 */

'use client';

import type { ReactNode } from 'react';
import { AxisTooltip } from './AxisTooltip';

export interface AxisSidebarItemProps {
  id: string;
  label: string;
  icon: ReactNode;
  active?: boolean;
  disabled?: boolean;
  collapsed?: boolean;
  indent?: boolean;
  badge?: number | string;
  onClick: () => void;
}

export function AxisSidebarItem({
  id,
  label,
  icon,
  active = false,
  disabled = false,
  collapsed = false,
  indent = false,
  badge,
  onClick,
}: AxisSidebarItemProps) {
  const baseClasses = [
    'group flex items-center gap-3 h-8 rounded-md cursor-pointer select-none',
    'transition-colors duration-150',
    indent && !collapsed ? 'pl-10 pr-3' : 'px-3',
    collapsed ? 'justify-center px-0 mx-auto w-10' : '',
  ];

  const stateClasses = disabled
    ? 'opacity-40 cursor-not-allowed'
    : active
      ? 'sidebar-item-active font-medium'
      : 'text-content-secondary hover:bg-surface-raised';

  const content = (
    <button
      type="button"
      role="menuitem"
      aria-current={active ? 'page' : undefined}
      aria-disabled={disabled}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      className={`${baseClasses.join(' ')} ${stateClasses} w-full`}
      title={collapsed ? undefined : label}
    >
      <span className="flex-shrink-0">{icon}</span>

      {!collapsed && (
        <>
          <span className="truncate text-sm leading-5">{label}</span>
          {badge !== undefined && (
            <span className="ml-auto flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full text-xs font-medium flex items-center justify-center bg-error-100 text-error-700 dark:bg-error-900 dark:text-error-300">
              {badge}
            </span>
          )}
        </>
      )}
    </button>
  );

  // In collapsed mode, wrap with tooltip showing the label
  if (collapsed) {
    return (
      <AxisTooltip content={label} placement="right">
        {content}
      </AxisTooltip>
    );
  }

  return content;
}
