/**
 * Navigation breadcrumb — last 10 routes the user visited before submitting
 * feedback. Wired to Next.js App Router via `usePathname()` from the Dashboard
 * useEffect.
 */

const PATH_SIZE = 10;
const path: string[] = [];

export function recordNavigation(route: string): void {
  if (!route) return;
  if (path[path.length - 1] === route) return;
  path.push(route);
  if (path.length > PATH_SIZE) path.shift();
}

export function getNavigationPath(): string[] {
  return [...path];
}
