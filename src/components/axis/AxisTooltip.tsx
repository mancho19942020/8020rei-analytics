/**
 * AxisTooltip Component
 *
 * A dark tooltip that appears on hover, matching the 8020 design system.
 * Dark background (#111827), white text, rounded corners, directional arrow.
 *
 * Uses a React Portal (renders into document.body) so the tooltip is never
 * clipped by overflow:hidden on parent widget containers.
 *
 * Viewport clamping: after the first render, useLayoutEffect measures the
 * tooltip's actual bounding rect and shifts it horizontally (or vertically)
 * to keep it fully within the viewport with an 8px margin.
 *
 * USAGE:
 * <AxisTooltip content="Explanation text" placement="top">
 *   <span>Hover me</span>
 * </AxisTooltip>
 *
 * With title:
 * <AxisTooltip title="Healthy" content="Active in the last 30 days..." placement="top">
 *   <RiskBadge level="healthy" />
 * </AxisTooltip>
 */

'use client';

import { useState, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode, CSSProperties } from 'react';

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface AxisTooltipProps {
  /** Main tooltip text or content */
  content: ReactNode;
  /** Optional bold title shown above content */
  title?: string;
  /** Where the tooltip appears relative to the trigger element (default: 'top') */
  placement?: TooltipPlacement;
  /** Maximum width of the tooltip box in pixels (default: 240) */
  maxWidth?: number;
  /** The element that triggers the tooltip on hover */
  children: ReactNode;
}

const BG = '#111827'; // gray-900
const GAP = 8; // px gap between trigger and tooltip box
const VIEWPORT_MARGIN = 8; // min px from viewport edge

/** CSS border-trick arrow pointing toward the trigger */
const ARROW_STYLE: Record<TooltipPlacement, CSSProperties> = {
  top: {
    position: 'absolute',
    top: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    width: 0, height: 0,
    borderLeft: '5px solid transparent',
    borderRight: '5px solid transparent',
    borderTop: `5px solid ${BG}`,
  },
  bottom: {
    position: 'absolute',
    bottom: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    width: 0, height: 0,
    borderLeft: '5px solid transparent',
    borderRight: '5px solid transparent',
    borderBottom: `5px solid ${BG}`,
  },
  left: {
    position: 'absolute',
    left: '100%',
    top: '50%',
    transform: 'translateY(-50%)',
    width: 0, height: 0,
    borderTop: '5px solid transparent',
    borderBottom: '5px solid transparent',
    borderLeft: `5px solid ${BG}`,
  },
  right: {
    position: 'absolute',
    right: '100%',
    top: '50%',
    transform: 'translateY(-50%)',
    width: 0, height: 0,
    borderTop: '5px solid transparent',
    borderBottom: '5px solid transparent',
    borderRight: `5px solid ${BG}`,
  },
};

/** Compute the initial (unclamped) page-level position of the tooltip container */
function getPortalStyle(
  rect: DOMRect,
  placement: TooltipPlacement
): CSSProperties {
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;

  switch (placement) {
    case 'top':
      return {
        position: 'absolute',
        top: rect.top + scrollY - GAP,
        left: rect.left + scrollX + rect.width / 2,
        transform: 'translate(-50%, -100%)',
      };
    case 'bottom':
      return {
        position: 'absolute',
        top: rect.bottom + scrollY + GAP,
        left: rect.left + scrollX + rect.width / 2,
        transform: 'translateX(-50%)',
      };
    case 'left':
      return {
        position: 'absolute',
        top: rect.top + scrollY + rect.height / 2,
        left: rect.left + scrollX - GAP,
        transform: 'translate(-100%, -50%)',
      };
    case 'right':
      return {
        position: 'absolute',
        top: rect.top + scrollY + rect.height / 2,
        left: rect.right + scrollX + GAP,
        transform: 'translateY(-50%)',
      };
  }
}

export function AxisTooltip({
  content,
  title,
  placement = 'top',
  maxWidth = 240,
  children,
}: AxisTooltipProps) {
  const [portalStyle, setPortalStyle] = useState<CSSProperties | null>(null);
  // Tooltip starts invisible so useLayoutEffect can measure & clamp before first paint
  const [visible, setVisible] = useState(false);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLSpanElement>(null);
  // Prevents the measurement effect from running twice for the same hover
  const measuredRef = useRef(false);

  const handleMouseEnter = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    measuredRef.current = false;
    setVisible(false);
    setPortalStyle(getPortalStyle(rect, placement));
  };

  const handleMouseLeave = () => {
    setPortalStyle(null);
    setVisible(false);
  };

  /**
   * After the portal renders (but before paint), measure the actual tooltip
   * bounding rect and shift `left` to keep it within the viewport.
   * getBoundingClientRect() reflects the real rendered position including
   * CSS transforms, so the delta we compute is pixel-accurate.
   */
  useLayoutEffect(() => {
    if (!portalStyle || !tooltipRef.current || measuredRef.current) return;
    measuredRef.current = true;

    const el = tooltipRef.current;
    const elRect = el.getBoundingClientRect();

    let deltaX = 0;
    if (elRect.left < VIEWPORT_MARGIN) {
      // Overflowing left edge — shift right
      deltaX = VIEWPORT_MARGIN - elRect.left;
    } else if (elRect.right > window.innerWidth - VIEWPORT_MARGIN) {
      // Overflowing right edge — shift left
      deltaX = window.innerWidth - VIEWPORT_MARGIN - elRect.right;
    }

    if (deltaX !== 0) {
      // Adjust the `left` anchor. Since the tooltip is centered via CSS transform,
      // adding deltaX to `left` shifts the visual position by exactly deltaX pixels.
      setPortalStyle(prev =>
        prev ? { ...prev, left: (prev.left as number) + deltaX } : prev
      );
    }

    // Reveal the tooltip (batched with the style update if deltaX !== 0)
    setVisible(true);
  }, [portalStyle]);

  const isOpen = portalStyle !== null;

  return (
    <span
      ref={triggerRef}
      style={{ display: 'inline-flex' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}

      {isOpen && typeof document !== 'undefined' &&
        createPortal(
          <span
            ref={tooltipRef}
            role="tooltip"
            style={{
              ...portalStyle,
              zIndex: 9999,
              pointerEvents: 'none',
              opacity: visible ? 1 : 0,
            }}
          >
            {/* Tooltip box */}
            <span
              style={{
                display: 'block',
                backgroundColor: BG,
                color: 'white',
                borderRadius: 8,
                padding: '8px 12px',
                fontSize: 12,
                lineHeight: '1.55',
                boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
                maxWidth,
                whiteSpace: 'normal',
                textAlign: 'left',
              }}
            >
              {title && (
                <span
                  style={{
                    display: 'block',
                    fontWeight: 600,
                    color: 'white',
                    marginBottom: 4,
                    fontSize: 12,
                  }}
                >
                  {title}
                </span>
              )}
              <span style={{ display: 'block', color: 'rgba(255,255,255,0.82)' }}>
                {content}
              </span>
            </span>

            {/* Directional arrow */}
            <span style={ARROW_STYLE[placement]} />
          </span>,
          document.body
        )}
    </span>
  );
}
