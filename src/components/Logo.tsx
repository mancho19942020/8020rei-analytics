/**
 * Logo Component
 *
 * Displays the 8020METRICS HUB logo with automatic light/dark mode support.
 * Renders both logo variants and uses CSS to show/hide based on theme.
 *
 * USAGE:
 * <Logo />
 * <Logo className="h-6" />
 */

'use client';

interface LogoProps {
  className?: string;
}

export function Logo({ className = 'h-4 w-auto' }: LogoProps) {
  return (
    <>
      {/* Light mode logo (dark text) - visible in light mode, hidden in dark mode */}
      <img
        src="/logo/logo-light.svg"
        alt="8020METRICS HUB"
        className={`${className} block dark:hidden`}
      />
      {/* Dark mode logo (white text) - hidden in light mode, visible in dark mode */}
      <img
        src="/logo/logo-dark.svg"
        alt="8020METRICS HUB"
        className={`${className} hidden dark:block`}
      />
    </>
  );
}
