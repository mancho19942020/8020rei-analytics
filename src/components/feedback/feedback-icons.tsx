/**
 * Inline SVG icons used by the feedback feature.
 * Heroicons-style stroke convention to match the rest of the metrics hub
 * (see `SuggestionsButton.tsx`).
 */

import type { ReactElement } from 'react';

interface IconProps {
  className?: string;
}

export function MessageSquarePlus({ className = 'w-5 h-5' }: IconProps): ReactElement {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 7.5v6m3-3h-6M3.75 12c0 4.556 4.03 8.25 9 8.25a9.764 9.764 0 0 0 2.555-.337A5.972 5.972 0 0 0 18.75 21a5.984 5.984 0 0 0-.512-2.426A8.207 8.207 0 0 0 21.75 12c0-4.556-4.03-8.25-9-8.25S3.75 7.444 3.75 12Z"
      />
    </svg>
  );
}

export function CopyIcon({ className = 'w-4 h-4' }: IconProps): ReactElement {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75A1.125 1.125 0 0 1 3.75 20.625V7.875C3.75 7.254 4.254 6.75 4.875 6.75H7.5m6 0v9.75c0 .621.504 1.125 1.125 1.125h2.625a1.125 1.125 0 0 0 1.125-1.125v-9.75M13.5 6.75H10.875A1.125 1.125 0 0 1 9.75 5.625V3.375A1.125 1.125 0 0 1 10.875 2.25h2.625a1.125 1.125 0 0 1 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125Z"
      />
    </svg>
  );
}

export function CloseIcon({ className = 'w-3.5 h-3.5' }: IconProps): ReactElement {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export function ChevronDownIcon({ className = 'w-4 h-4' }: IconProps): ReactElement {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

export function PencilIcon({ className = 'w-4 h-4' }: IconProps): ReactElement {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.862 4.487 18.549 2.799a2.121 2.121 0 1 1 3 3L19.862 7.487M16.862 4.487 6 15.349V18h2.651L19.862 7.487M16.862 4.487 19.862 7.487"
      />
    </svg>
  );
}

export function TrashIcon({ className = 'w-4 h-4' }: IconProps): ReactElement {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
      />
    </svg>
  );
}

export function CheckCircleIcon({ className = 'w-4 h-4' }: IconProps): ReactElement {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

export function InboxIcon({ className = 'w-5 h-5' }: IconProps): ReactElement {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 0 0-2.15-1.588H6.911a2.25 2.25 0 0 0-2.15 1.588L2.35 13.177a2.25 2.25 0 0 0-.1.661Z"
      />
    </svg>
  );
}
