/**
 * AxisNavigationTab Component (React/Next.js version)
 *
 * Tab navigation for switching between different sections or views within the same screen.
 *
 * USAGE:
 * <AxisNavigationTab activeTab={activeTab} onTabChange={setActiveTab} tabs={tabs} />
 * <AxisNavigationTab activeTab={activeTab} onTabChange={setActiveTab} tabs={tabs} variant="contained" />
 *
 * PRIMARY USE:
 * - Navigating between different sections or views within the same screen
 * - When content completely changes between tabs
 * - When each tab represents a distinct view (pages or sub-sections)
 *
 * VARIANTS:
 * - line (default): Underline indicator for selected tab
 * - contained: Pill/badge style background for selected tab
 *
 * ACCESSIBILITY:
 * - Uses proper role="tablist" with aria-label
 * - Each tab has role="tab" with aria-selected
 * - Keyboard navigation with arrow keys
 * - Focus management for accessibility
 */

'use client';

import React, { useRef, ReactNode } from 'react';

export interface AxisNavigationTabItem {
  /** Unique identifier for the tab */
  id: string;
  /** Display name shown in the tab */
  name: string;
  /** Icon component (optional) */
  icon?: ReactNode;
  /** Disable this tab */
  disabled?: boolean;
  /** Badge count (optional) */
  badge?: number | string;
  /** Navigation href (optional, for Next.js Link) */
  href?: string;
}

export interface AxisNavigationTabProps {
  /** Currently selected tab ID */
  activeTab: string;
  /** Callback when tab changes */
  onTabChange: (tabId: string) => void;
  /** Available tabs */
  tabs: AxisNavigationTabItem[];
  /** Visual variant */
  variant?: 'line' | 'contained';
  /** Size of the tabs */
  size?: 'sm' | 'md';
  /** Accessible label for the tab list */
  ariaLabel?: string;
  /** Full width - tabs fill container equally */
  fullWidth?: boolean;
}

export function AxisNavigationTab({
  activeTab,
  onTabChange,
  tabs,
  variant = 'line',
  size = 'md',
  ariaLabel = 'Navigation tabs',
  fullWidth = false,
}: AxisNavigationTabProps) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Handle tab selection
  const selectTab = (tab: AxisNavigationTabItem) => {
    if (tab.disabled) return;
    onTabChange(tab.id);
  };

  // Keyboard navigation
  const handleKeydown = (event: React.KeyboardEvent, currentIndex: number) => {
    const enabledTabs = tabs.filter(t => !t.disabled);
    const currentEnabledIndex = enabledTabs.findIndex(t => t.id === tabs[currentIndex].id);

    let newIndex = currentEnabledIndex;

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        newIndex = currentEnabledIndex > 0 ? currentEnabledIndex - 1 : enabledTabs.length - 1;
        break;
      case 'ArrowRight':
        event.preventDefault();
        newIndex = currentEnabledIndex < enabledTabs.length - 1 ? currentEnabledIndex + 1 : 0;
        break;
      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        newIndex = enabledTabs.length - 1;
        break;
      default:
        return;
    }

    const newTab = enabledTabs[newIndex];
    const newActualIndex = tabs.findIndex(t => t.id === newTab.id);

    tabRefs.current[newActualIndex]?.focus();
    selectTab(newTab);
  };

  // Size-based classes
  const sizeClasses = {
    sm: {
      tab: 'h-9 px-4 text-body-regular',
      icon: 'w-4 h-4',
      gap: 'gap-2.5',
    },
    md: {
      tab: 'h-[52px] px-6 text-body-large',
      icon: 'w-5 h-5',
      gap: 'gap-3',
    },
  }[size];

  // Get tab classes based on state and variant
  const getTabClasses = (tab: AxisNavigationTabItem) => {
    const selected = activeTab === tab.id;
    const isDisabled = tab.disabled;

    const baseClasses = [
      'inline-flex items-center justify-center',
      'whitespace-nowrap',
      'transition-colors duration-150',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-main-500 focus-visible:ring-inset',
      sizeClasses.tab,
      sizeClasses.gap,
    ];

    if (variant === 'line') {
      baseClasses.push('border-b-2');

      if (isDisabled) {
        baseClasses.push(
          'cursor-not-allowed',
          'border-transparent',
          'text-content-disabled',
        );
      } else if (selected) {
        baseClasses.push(
          'cursor-pointer',
          'font-semibold',
          'selected-tab-line',
        );
      } else {
        baseClasses.push(
          'cursor-pointer',
          'border-transparent',
          'text-content-secondary',
          'hover:text-content-primary',
          'hover:border-neutral-300 dark:hover:border-neutral-600',
        );
      }
    } else {
      // contained variant
      if (isDisabled) {
        baseClasses.push(
          'cursor-not-allowed',
          'text-content-disabled',
          'rounded-lg',
        );
      } else if (selected) {
        baseClasses.push(
          'cursor-pointer',
          'bg-main-50 dark:bg-main-950',
          'font-semibold',
          'rounded-lg',
          'selected-tab-contained',
        );
      } else {
        baseClasses.push(
          'cursor-pointer',
          'text-content-secondary',
          'hover:text-content-primary',
          'hover:bg-neutral-50 dark:hover:bg-neutral-800',
          'rounded-lg',
        );
      }
    }

    return baseClasses.filter(Boolean).join(' ');
  };

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={[
        'flex items-center',
        variant === 'line' ? 'border-b border-stroke' : 'gap-1 p-1 bg-surface-raised rounded-lg',
        fullWidth ? 'w-full' : '',
      ].filter(Boolean).join(' ')}
    >
      {tabs.map((tab, index) => (
        <button
          key={tab.id}
          ref={(el) => { tabRefs.current[index] = el; }}
          role="tab"
          type="button"
          aria-selected={activeTab === tab.id}
          aria-disabled={tab.disabled}
          tabIndex={activeTab === tab.id ? 0 : -1}
          className={[
            getTabClasses(tab),
            fullWidth ? 'flex-1' : '',
          ].filter(Boolean).join(' ')}
          onClick={() => selectTab(tab)}
          onKeyDown={(e) => handleKeydown(e, index)}
        >
          {/* Icon (optional) */}
          {tab.icon && (
            <span className={`${sizeClasses.icon} flex items-center justify-center shrink-0`} aria-hidden="true">
              {tab.icon}
            </span>
          )}

          {/* Tab name */}
          <span>{tab.name}</span>

          {/* Badge (optional) */}
          {tab.badge !== undefined && (
            <span
              className={[
                'inline-flex items-center justify-center',
                'min-w-[20px] h-5 px-1.5',
                'text-label font-medium rounded-full',
                activeTab === tab.id
                  ? 'bg-main-100 dark:bg-main-900 text-main-700 dark:text-main-300'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-content-secondary',
              ].filter(Boolean).join(' ')}
            >
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
