/**
 * Element context capture — runs at click time.
 *
 * Walks up the DOM from the click target looking for a meaningful ancestor,
 * classifies it, extracts a label, finds the nearest section heading, builds
 * a 5-level CSS selector, and scans for visible KPI numbers in the same card.
 *
 * The class names probed below are the metrics-hub's actual primitives:
 * AxisCard renders with `data-axis="card"`; the project also has hand-written
 * `card-surface`, `kpi-card`, `chart-card`, `big-value` classes scattered
 * through dashboard widgets. We probe both so the heuristic works on every
 * surface the user might Shift+Click.
 */

import type { FeedbackTargetContext } from './types';

const MAX_WALK_LEVELS = 10;

function safeClassName(el: Element): string {
  const cls = (el as HTMLElement).className;
  return typeof cls === 'string' ? cls : '';
}

export function findMeaningfulElement(target: HTMLElement): HTMLElement {
  let el: HTMLElement | null = target;
  let level = 0;

  while (el && level < MAX_WALK_LEVELS) {
    if (el.id === 'main-content' || el.tagName === 'MAIN') break;

    if (el.hasAttribute('data-feedback-label')) return el;

    const cls = safeClassName(el);

    if (
      cls.includes('card-surface') ||
      cls.includes('kpi-card') ||
      cls.includes('chart-card') ||
      cls.includes('stat-card') ||
      cls.includes('big-value') ||
      cls.includes('bigvalue')
    ) {
      return el;
    }

    if (el.getAttribute('data-axis') === 'card') return el;

    if (el.tagName === 'BUTTON' || el.getAttribute('role') === 'button') return el;
    if (el.tagName === 'A') return el;

    if (el.tagName === 'SECTION' || el.tagName === 'ARTICLE') return el;

    if (el.getAttribute('aria-label')) return el;

    if (el.querySelector('h1, h2, h3, h4, h5, h6')) return el;

    el = el.parentElement;
    level++;
  }

  return target;
}

export function inferElementType(el: HTMLElement): string {
  const tag = el.tagName.toLowerCase();
  const cls = safeClassName(el);
  const role = el.getAttribute('role');
  const axis = el.getAttribute('data-axis');

  if (cls.includes('big-value') || cls.includes('bigvalue')) return 'big-value';
  if (cls.includes('kpi-card') || cls.includes('kpicard')) return 'kpi-card';
  if (cls.includes('chart-card') || cls.includes('chartcard')) return 'chart-card';
  if (cls.includes('card-surface') || cls.includes('stat-card') || axis === 'card') return 'card';
  if (cls.includes('table-scroll') || tag === 'table' || axis === 'table') return 'data-table';
  if (el.querySelector('table')) return 'data-table';
  if (el.querySelector('canvas, svg.echarts, [class*="echarts"], [class*="recharts"]'))
    return 'chart';

  if (tag === 'button' || role === 'button') return 'button';
  if (tag === 'a') return 'link';
  if (tag === 'input' || tag === 'select' || tag === 'textarea') return 'form-input';
  if (role === 'tab' || role === 'tabpanel') return 'tab';
  if (role === 'dialog' || role === 'alertdialog') return 'modal';

  if (tag === 'nav' || role === 'navigation') return 'navigation';
  if (tag === 'aside') return 'sidebar';
  if (tag === 'header') return 'page-header';
  if (tag === 'footer') return 'page-footer';

  if (/^h[1-6]$/.test(tag)) return `heading-${tag}`;

  if (cls.includes('header-margin') || cls.includes('section-header')) return 'section-heading';
  if (cls.includes('page-padding')) return 'page-content';
  if (cls.includes('drawer') || cls.includes('Drawer')) return 'drawer';
  if (cls.includes('modal') || cls.includes('Modal')) return 'modal';
  if (cls.includes('banner') || cls.includes('Banner')) return 'banner';
  if (cls.includes('badge') || cls.includes('Badge') || cls.includes('AxisTag')) return 'badge';
  if (cls.includes('skeleton') || cls.includes('animate-pulse')) return 'loading-skeleton';
  if (cls.includes('tooltip') || cls.includes('Tooltip')) return 'tooltip';

  if (tag === 'img') return 'image';
  if (tag === 'svg') return 'icon';
  if (tag === 'video' || tag === 'audio') return 'media';

  if (tag === 'ul' || tag === 'ol') return 'list';
  if (tag === 'li') return 'list-item';

  if (tag === 'p' || tag === 'span') {
    const text = (el.textContent ?? '').trim();
    if (text.length > 100) return 'text-block';
    if (text.length > 0) return 'text-label';
  }

  if (tag === 'section' || tag === 'article') return 'section';
  if (tag === 'div' && el.children.length > 2) return 'container';
  if (tag === 'div') return 'element';
  return 'element';
}

export function extractLabel(el: HTMLElement): string {
  const fb = el.getAttribute('data-feedback-label');
  if (fb) return fb;

  const aria = el.getAttribute('aria-label');
  if (aria) return aria;

  const title = el.getAttribute('title');
  if (title) return title;

  const heading = el.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading?.textContent) return heading.textContent.trim().slice(0, 100);

  const labelEl = el.querySelector(
    '.text-content-secondary, .text-muted-foreground, [class*="label"], [class*="title"]'
  );
  if (labelEl?.textContent) return labelEl.textContent.trim().slice(0, 100);

  if (el.tagName === 'BUTTON' || el.tagName === 'A') {
    const text = (el.textContent ?? '').trim();
    if (text && text.length < 80) return text;
  }

  const text = (el.textContent ?? '').trim();
  return text.slice(0, 80) || 'Unnamed element';
}

export function findSectionName(el: HTMLElement): string | null {
  let current: HTMLElement | null = el;
  let level = 0;

  while (current && level < 15) {
    let sibling = current.previousElementSibling;
    while (sibling) {
      if (sibling.tagName === 'H2' || sibling.tagName === 'H3') {
        return sibling.textContent?.trim() ?? null;
      }
      sibling = sibling.previousElementSibling;
    }

    if (current.parentElement) {
      const heading: Element | null = current.parentElement.querySelector(':scope > h2, :scope > h3');
      if (heading && heading !== current) return heading.textContent?.trim() ?? null;
    }

    current = current.parentElement;
    level++;
  }
  return null;
}

export function buildSelectorPath(el: HTMLElement): string {
  const parts: string[] = [];
  let current: HTMLElement | null = el;
  let depth = 0;

  while (current && depth < 5) {
    const tag = current.tagName.toLowerCase();
    if (tag === 'body' || tag === 'html') break;

    let selector = tag;

    if (current.id) {
      parts.unshift(`${selector}#${current.id}`);
      break;
    }

    const cls = safeClassName(current);
    if (cls) {
      const meaningful = cls
        .split(/\s+/)
        .filter(
          (c) =>
            !c.startsWith('hover:') &&
            !c.startsWith('dark:') &&
            !c.startsWith('sm:') &&
            !c.startsWith('md:') &&
            !c.startsWith('lg:') &&
            !c.startsWith('xl:') &&
            !c.startsWith('focus:') &&
            !c.startsWith('focus-visible:') &&
            !c.startsWith('disabled:') &&
            !c.startsWith('transition') &&
            !c.startsWith('duration') &&
            c.length > 2 &&
            c.length < 40
        )
        .slice(0, 3);
      if (meaningful.length) selector += '.' + meaningful.join('.');
    }

    if (current.parentElement) {
      const siblings = Array.from(current.parentElement.children).filter(
        (s) => s.tagName === current!.tagName
      );
      if (siblings.length > 1) {
        selector += `:nth-of-type(${siblings.indexOf(current) + 1})`;
      }
    }

    parts.unshift(selector);
    current = current.parentElement;
    depth++;
  }

  return parts.join(' > ');
}

export function extractVisibleText(el: HTMLElement): string {
  const ownText = (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 150);
  const siblings: string[] = [];
  const prev = el.previousElementSibling;
  const next = el.nextElementSibling;
  if (prev?.textContent) {
    const t = prev.textContent.trim().replace(/\s+/g, ' ').slice(0, 60);
    if (t) siblings.push(`[before: "${t}"]`);
  }
  if (next?.textContent) {
    const t = next.textContent.trim().replace(/\s+/g, ' ').slice(0, 60);
    if (t) siblings.push(`[after: "${t}"]`);
  }
  return siblings.length ? `${ownText} ${siblings.join(' ')}` : ownText;
}

export function findParentComponentHint(el: HTMLElement): string | null {
  let current: HTMLElement | null = el.parentElement;
  let level = 0;
  const hints: string[] = [];

  while (current && level < 8) {
    const tag = current.tagName.toLowerCase();
    if (tag === 'main' || tag === 'body') break;

    const cls = safeClassName(current);
    if (cls.includes('card-surface')) hints.push('inside card-surface');
    if (cls.includes('page-padding')) hints.push('inside page-padding');
    if (cls.includes('drawer')) hints.push('inside drawer');
    if (cls.includes('modal') || current.getAttribute('role') === 'dialog')
      hints.push('inside modal');
    if (cls.includes('tab-content') || current.getAttribute('role') === 'tabpanel')
      hints.push('inside tab panel');

    const fl = current.getAttribute('data-feedback-label');
    if (fl) hints.push(`inside "${fl}"`);
    const sec = current.getAttribute('data-section');
    if (sec) hints.push(`section: "${sec}"`);

    current = current.parentElement;
    level++;
  }
  return hints.length ? hints.join(', ') : null;
}

export function extractVisibleValues(el: HTMLElement): Record<string, string> {
  const values: Record<string, string> = {};
  const metricRe = /^\s*(\$[\d,]+(?:\.\d+)?[KMB]?|[\d,]+(?:\.\d+)?%|[\d,]{2,}(?:\.\d+)?[KMB]?)\s*$/;

  let container: HTMLElement | null = el;
  for (let i = 0; i < 5; i++) {
    if (!container) break;
    const cls = safeClassName(container);
    if (
      cls.includes('card-surface') ||
      cls.includes('big-value') ||
      cls.includes('kpi-card') ||
      cls.includes('chart-card') ||
      cls.includes('stat-card') ||
      container.getAttribute('data-axis') === 'card' ||
      container.tagName === 'SECTION' ||
      container.tagName === 'ARTICLE'
    ) {
      break;
    }
    if (!container.parentElement) break;
    container = container.parentElement;
  }
  if (!container) return values;

  const isChart =
    container.querySelector(
      'canvas, svg.echarts, [class*="echarts"], [class*="recharts"]'
    ) !== null;
  if (isChart) {
    const heading = container.querySelector('h1, h2, h3, h4, h5, h6');
    if (heading?.textContent) values['chart'] = heading.textContent.trim();
    return values;
  }

  const table = container.querySelector('table');
  if (table) {
    const rows = table.querySelectorAll('tbody tr');
    if (rows.length > 0) values['rows'] = String(rows.length);
  }

  const allEls = container.querySelectorAll<HTMLElement>('*');
  for (const node of Array.from(allEls)) {
    if (Object.keys(values).length >= 10) break;
    const text = (node.textContent ?? '').trim();
    if (!metricRe.test(text)) continue;

    const dup = Array.from(node.children).some(
      (c) => (c.textContent ?? '').trim() === text
    );
    if (dup) continue;

    let label = '';
    const prevSib = node.previousElementSibling as HTMLElement | null;
    if (prevSib) {
      const t = (prevSib.textContent ?? '').trim();
      if (t && !metricRe.test(t) && t.length < 80) label = t;
    }
    if (!label) {
      const nextSib = node.nextElementSibling as HTMLElement | null;
      if (nextSib) {
        const t = (nextSib.textContent ?? '').trim();
        if (t && !metricRe.test(t) && t.length < 80) label = t;
      }
    }
    if (!label && node.parentElement) {
      const lbl = node.parentElement.querySelector(
        '.text-content-secondary, .text-content-tertiary, .text-muted-foreground'
      );
      if (lbl?.textContent) {
        const t = lbl.textContent.trim();
        if (t && t.length < 80) label = t;
      }
    }
    if (!label) {
      let anc: HTMLElement | null = node.parentElement;
      for (let i = 0; i < 4 && anc; i++) {
        const fl = anc.getAttribute('data-feedback-label');
        if (fl) {
          label = fl;
          break;
        }
        anc = anc.parentElement;
      }
    }

    if (label && !values[label]) values[label] = text;
    else if (!label) {
      const idx = Object.keys(values).filter((k) => k.startsWith('value')).length;
      values[`value${idx + 1}`] = text;
    }
  }
  return values;
}

export function buildContextFromElement(el: HTMLElement): FeedbackTargetContext {
  const rect = el.getBoundingClientRect();
  const params =
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  return {
    elementType: inferElementType(el),
    label: extractLabel(el),
    sectionName: findSectionName(el),
    visibleText: extractVisibleText(el),
    selectorPath: buildSelectorPath(el),
    pageRoute: typeof window !== 'undefined' ? window.location.pathname : '',
    tabName: params?.get('tab') ?? null,
    timestamp: new Date().toISOString(),
    boundingRect: {
      top: Math.round(rect.top),
      left: Math.round(rect.left),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    },
    parentHint: findParentComponentHint(el),
  };
}
