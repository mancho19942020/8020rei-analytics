/**
 * AxisModal Component
 *
 * A reusable modal/dialog overlay following the Axis design system.
 * Renders via React Portal into document.body so it's never clipped
 * by overflow:hidden on parent containers.
 *
 * Features:
 * - Backdrop click to close
 * - Escape key to close
 * - Focus trap (Tab / Shift+Tab cycles within modal)
 * - Three sizes: sm (480px), md (600px), lg (780px)
 * - Optional footer slot
 * - Scroll lock on body while open
 *
 * USAGE:
 * <AxisModal open={isOpen} onClose={() => setIsOpen(false)} title="Add Profile">
 *   <p>Modal content here</p>
 * </AxisModal>
 *
 * With footer:
 * <AxisModal
 *   open={isOpen}
 *   onClose={handleClose}
 *   title="Confirm"
 *   footer={<><AxisButton onClick={handleClose}>Cancel</AxisButton><AxisButton variant="filled">Save</AxisButton></>}
 * >
 *   <p>Are you sure?</p>
 * </AxisModal>
 */

'use client';

import { useEffect, useRef, useCallback, ReactNode } from 'react';
import { createPortal } from 'react-dom';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

export interface AxisModalProps {
  /** Whether the modal is visible */
  open: boolean;
  /** Called when the modal should close (backdrop click, Escape, X button) */
  onClose: () => void;
  /** Modal heading */
  title: string;
  /** Body content */
  children: ReactNode;
  /** Optional footer slot (action buttons etc.) */
  footer?: ReactNode;
  /** Max-width preset */
  size?: ModalSize;
  /** Prevent closing on backdrop click */
  disableBackdropClose?: boolean;
  /** When true, the body does not scroll — children manage their own scroll (e.g. a full-height AxisTable) */
  fitContent?: boolean;
  /** Override the dialog max height (default: 70vh). Use a CSS length such as '92vh' for taller forms. */
  maxHeight?: string;
}

const SIZE_WIDTHS: Record<ModalSize, number> = {
  sm: 480,
  md: 600,
  lg: 780,
  xl: 1000,
};

export function AxisModal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  disableBackdropClose = false,
  fitContent = false,
  maxHeight = '70vh',
}: AxisModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const maxWidth = SIZE_WIDTHS[size];

  // Keep onClose ref current without re-triggering effects
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  // Lock body scroll while open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  // Close on Escape key + focus trap
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
        return;
      }

      // Focus trap
      if (e.key !== 'Tab') return;
      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusable = dialog.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    // Move focus into dialog only when first opening
    setTimeout(() => {
      const dialog = dialogRef.current;
      if (!dialog) return;
      const first = dialog.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      first?.focus();
    }, 50);

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
      }}
      aria-modal="true"
      role="dialog"
      aria-label={title}
    >
      {/* Backdrop */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.45)',
          backdropFilter: 'blur(2px)',
        }}
        onClick={disableBackdropClose ? undefined : () => onCloseRef.current()}
        aria-hidden="true"
      />

      {/* Dialog panel */}
      <div
        ref={dialogRef}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth,
          height: fitContent ? maxHeight : undefined,
          maxHeight,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
        }}
        className="bg-surface-base border border-stroke"
      >
        {/* Header */}
        <div
          className="border-b border-stroke"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            flexShrink: 0,
          }}
        >
          <h2 className="text-h4 font-semibold text-content-primary" style={{ margin: 0 }}>
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="text-content-tertiary hover:text-content-primary transition-colors"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: 8,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: fitContent ? 'flex' : undefined,
            flexDirection: fitContent ? 'column' : undefined,
            overflow: fitContent ? 'hidden' : undefined,
            overflowY: fitContent ? undefined : 'auto',
            padding: '24px',
          }}
        >
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            className="border-t border-stroke"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 12,
              padding: '16px 24px',
              flexShrink: 0,
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
