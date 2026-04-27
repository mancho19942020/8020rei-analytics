/**
 * Admin-side: build a clean, paste-ready Claude / Cursor / ChatGPT prompt
 * from a FeedbackItem. Pulls from the typed `componentContext` rather than
 * re-parsing the AI marker block — guarantees a clean output even if the
 * description was edited.
 */

import type { FeedbackItem } from './types';
import { parseFeedback } from './parse-feedback';

const TYPE_VERB: Record<string, string> = {
  bug: 'reported a bug',
  suggestion: 'suggested an improvement',
  question: 'asked a question',
};

export function buildPrompt(item: FeedbackItem): string {
  const ctx = item.componentContext ?? ({} as FeedbackItem['componentContext']);
  const parsed = parseFeedback(item.description);
  const action = parsed.type ? TYPE_VERB[parsed.type] ?? 'shared feedback' : 'shared feedback';

  const lines: string[] = [];
  lines.push(
    `A team member (${item.authorName ?? 'anonymous'}) ${action} about the 8020 Metrics Hub:`
  );
  lines.push('');
  lines.push('LOCATION:');
  if (ctx.pageRoute) {
    lines.push(`- Page: ${ctx.pageRoute}${ctx.tabName ? ` (tab: "${ctx.tabName}")` : ''}`);
  }
  if (ctx.sectionName) lines.push(`- Section: "${ctx.sectionName}"`);
  if (ctx.elementType || ctx.label) {
    lines.push(
      `- Element: ${ctx.elementType ?? 'element'}${ctx.label ? ` "${ctx.label}"` : ''}`
    );
  }
  if (ctx.parentHint) lines.push(`- Context: ${ctx.parentHint}`);
  if (ctx.visibleText) {
    const preview = ctx.visibleText.slice(0, 200).replace(/\n+/g, ' ').trim();
    if (preview) lines.push(`- Content + neighbors: "${preview}"`);
  }
  if (ctx.selectorPath) lines.push(`- DOM selector: ${ctx.selectorPath}`);

  if (item.environmentContext) {
    const env = item.environmentContext;
    const params = Object.entries(env.urlParams ?? {})
      .map(([k, v]) => `${k}=${v}`)
      .join('&');
    if (params) lines.push(`- URL params: ${params}`);
    if (env.recentErrors?.length) {
      lines.push(`- Recent errors: ${env.recentErrors.join(' || ')}`);
    }
    const visible = Object.entries(env.visibleValues ?? {})
      .map(([k, v]) => `${k}=${v}`)
      .join(' | ');
    if (visible) lines.push(`- Visible values: ${visible}`);
  }

  if (item.deviceContext) {
    const d = item.deviceContext;
    lines.push(`- Device: ${d.browser} on ${d.os} (${d.viewportSize})`);
  }

  lines.push('');
  lines.push('FEEDBACK:');
  lines.push(parsed.userMessage || '(no description)');
  return lines.join('\n');
}
