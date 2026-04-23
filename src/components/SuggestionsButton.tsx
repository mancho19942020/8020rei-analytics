/**
 * SuggestionsButton Component
 *
 * Header toolbar button that opens the Suggestions modal.
 * Visible to all authenticated @8020rei.com users.
 *
 * USAGE:
 * <SuggestionsButton onClick={() => setSuggestionsOpen(true)} />
 */

'use client';

import { useState, useEffect } from 'react';
import { AxisButton } from '@/components/axis/AxisButton';

function LightbulbIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-5 h-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"
      />
    </svg>
  );
}

interface SuggestionsButtonProps {
  onClick: () => void;
}

export function SuggestionsButton({ onClick }: SuggestionsButtonProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="h-9 w-9 bg-surface-raised border border-stroke rounded-sm animate-pulse" />
    );
  }

  return (
    <AxisButton
      variant="outlined"
      size="md"
      iconOnly
      onClick={onClick}
      aria-label="Submit a suggestion"
      title="Suggestions"
      iconLeft={<LightbulbIcon />}
    />
  );
}
