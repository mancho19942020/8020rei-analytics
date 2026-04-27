/**
 * Device context capture — runs at submit time.
 *
 * Pure UA parsing. We deliberately avoid `navigator.userAgentData` because
 * Firefox + Safari haven't shipped it broadly enough to rely on.
 */

import type { FeedbackDeviceContext } from './types';

function parseOS(ua: string): string {
  const mac = ua.match(/Mac OS X (\d+[._]\d+(?:[._]\d+)?)/);
  if (mac) return `macOS ${mac[1].replace(/_/g, '.')}`;

  const win = ua.match(/Windows NT (\d+\.\d+)/);
  if (win) {
    const map: Record<string, string> = {
      '10.0': '10/11',
      '6.3': '8.1',
      '6.2': '8',
      '6.1': '7',
    };
    return `Windows ${map[win[1]] ?? win[1]}`;
  }

  const android = ua.match(/Android (\d+(?:\.\d+)?)/);
  if (android) return `Android ${android[1]}`;

  const ios = ua.match(/(?:iPhone|iPad) OS (\d+[_.]\d+)/);
  if (ios) return `iOS ${ios[1].replace(/_/g, '.')}`;

  if (ua.includes('Linux')) return 'Linux';
  return 'Unknown OS';
}

function parseBrowser(ua: string): string {
  const edge = ua.match(/Edg\/(\d+(?:\.\d+)?)/);
  if (edge) return `Edge ${edge[1]}`;

  const chrome = ua.match(/Chrome\/(\d+(?:\.\d+)?)/);
  if (chrome && !ua.includes('Edg/')) return `Chrome ${chrome[1]}`;

  const ff = ua.match(/Firefox\/(\d+(?:\.\d+)?)/);
  if (ff) return `Firefox ${ff[1]}`;

  const safari = ua.match(/Version\/(\d+(?:\.\d+)?).+Safari/);
  if (safari) return `Safari ${safari[1]}`;

  return 'Unknown Browser';
}

export function captureDeviceContext(): FeedbackDeviceContext {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  return {
    os: parseOS(ua),
    browser: parseBrowser(ua),
    screenResolution:
      typeof screen !== 'undefined' ? `${screen.width}x${screen.height}` : 'unknown',
    viewportSize:
      typeof window !== 'undefined'
        ? `${window.innerWidth}x${window.innerHeight}`
        : 'unknown',
    pixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
  };
}

export const __test = { parseOS, parseBrowser };
