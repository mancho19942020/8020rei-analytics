/**
 * Console capture — last 10 console.error / window.onerror / unhandledrejection
 * messages. Initialised once at app boot from Dashboard's useEffect.
 *
 * The ring buffer lives at module scope so the overlay/save orchestrator can
 * read it without prop-drilling.
 */

const RING_SIZE = 10;
const ring: string[] = [];
let initialised = false;

function push(line: string): void {
  ring.push(line);
  if (ring.length > RING_SIZE) ring.shift();
}

export function initConsoleCapture(): void {
  if (initialised) return;
  if (typeof window === 'undefined') return;
  initialised = true;

  const original = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    try {
      const msg = args
        .map((a) => {
          if (typeof a === 'string') return a;
          if (a instanceof Error) return a.message;
          try {
            return JSON.stringify(a);
          } catch {
            return String(a);
          }
        })
        .join(' ')
        .slice(0, 500);
      push(`${new Date().toISOString()} ${msg}`);
    } catch {
      // Never let logging break logging.
    }
    original(...args);
  };

  window.addEventListener('error', (e) => {
    push(
      `${new Date().toISOString()} [error event] ${e.message} @ ${e.filename}:${e.lineno}`
    );
  });

  window.addEventListener('unhandledrejection', (e) => {
    const reason = e.reason;
    const msg =
      reason instanceof Error
        ? reason.message
        : typeof reason === 'string'
        ? reason
        : (() => {
            try {
              return JSON.stringify(reason);
            } catch {
              return String(reason);
            }
          })();
    push(`${new Date().toISOString()} [unhandled rejection] ${msg}`);
  });
}

export function getRecentErrors(): string[] {
  return [...ring];
}
