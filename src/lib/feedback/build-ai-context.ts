/**
 * Builds the hidden AI context block appended to the user's typed message.
 *
 * Marker strings are exact (`--- ELEMENT LOCATION` / `--- ENVIRONMENT`) — the
 * admin-side parser splits on them.
 */

import type {
  FeedbackEnvironmentContext,
  FeedbackTargetContext,
} from './types';

function formatRecord(record: Record<string, string>): string {
  const entries = Object.entries(record);
  if (entries.length === 0) return '(none)';
  return entries.map(([k, v]) => `${k}=${v}`).join(' | ');
}

export function buildAIContext(
  ctx: FeedbackTargetContext,
  env: FeedbackEnvironmentContext
): string {
  const lines: string[] = [];

  lines.push('--- ELEMENT LOCATION (auto-captured for AI — do NOT edit) ---');
  lines.push(
    `Route: ${ctx.pageRoute}${ctx.tabName ? ` | Active tab: "${ctx.tabName}"` : ''}`
  );
  if (ctx.sectionName) lines.push(`Section heading: "${ctx.sectionName}"`);
  lines.push(`Element type: ${ctx.elementType}`);
  if (ctx.label) lines.push(`Element label: "${ctx.label}"`);
  if (ctx.parentHint) lines.push(`Parent context: ${ctx.parentHint}`);
  if (ctx.visibleText) lines.push(`Visible text + neighbors: "${ctx.visibleText}"`);
  if (ctx.selectorPath) lines.push(`DOM selector (5-level): ${ctx.selectorPath}`);
  if (ctx.boundingRect) {
    const { top, left, width, height } = ctx.boundingRect;
    lines.push(`Viewport position: top=${top} left=${left} size=${width}x${height}`);
  }
  lines.push('--- END LOCATION ---');

  lines.push('--- ENVIRONMENT (auto-captured) ---');
  lines.push(`URL params: ${formatRecord(env.urlParams)}`);
  lines.push(`Page state: ${env.pageState}`);
  if (env.loadedSources.length > 0) {
    lines.push(`Loaded data: ${env.loadedSources.join(', ')}`);
  }
  if (env.navigationPath.length > 0) {
    lines.push(`Navigation: ${env.navigationPath.join(' → ')}`);
  }
  lines.push(
    `Recent errors: ${env.recentErrors.length === 0 ? '(none)' : env.recentErrors.join(' || ')}`
  );
  lines.push(`Visible values: ${formatRecord(env.visibleValues)}`);
  lines.push('--- END ENVIRONMENT ---');

  return lines.join('\n');
}
