/**
 * Admin cache-invalidation endpoint.
 *
 * PURPOSE: when a monolith-side data change lands (customer rate update,
 * test-domain exclusion change, era-rate contract update, etc.) and someone
 * wants the dashboard to reflect it immediately — without waiting for the
 * 5-min in-memory cache or the 30-min Aurora overview-cache cron — they can
 * POST to this endpoint with a list of key prefixes to clear.
 *
 * Added 2026-04-20 in response to the Apr 16 customer-rate update
 * (Johansy updated prod `parameters` from $0.63→$0.66 Std and $0.87→$0.90 FC)
 * where the metrics hub would otherwise show stale rates until the next cache
 * expiry. Now an engineer can force-refresh the relevant keys on demand.
 *
 * DOES NOT invalidate the Aurora-persisted `dm_overview_cache` table — only
 * the in-memory route caches in src/lib/cache.ts. The Aurora-persisted cache
 * is refreshed by /api/dm-overview/refresh (see GitHub Actions cron); a
 * caller who wants fresh PCM-invoice numbers should POST that endpoint too.
 *
 * USAGE:
 *   POST /api/admin/invalidate-cache
 *   body: { "prefixes": ["pcm-validation:", "rapid-response:"] }
 *
 *   Known prefixes (see individual routes for exact keys):
 *     - "pcm-validation:"        (margin summary, pricing history, price detection, etc.)
 *     - "rapid-response:"        (overview, campaign list, on-hold breakdown, alerts)
 *     - "dm-overview:"           (overview in-memory layer; Aurora cache is separate)
 *     - "dm-conversions:"        (business results)
 *     - ""                       (empty prefix = clear ALL — use cautiously)
 *
 * SAFETY:
 *   - Requires the same auth as every other route (Firebase token OR cron secret).
 *   - Only clears in-memory entries; no database writes; no schema changes.
 *   - Idempotent — calling twice is a no-op on the second call.
 *   - Effects limited to the single Cloud Run instance handling the request;
 *     other instances retain their own copies until their own TTLs expire.
 *     Acceptable for an admin "see fresh now" tool.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import { clearCacheByPrefix, getCacheStats } from '@/lib/cache';

export async function POST(request: NextRequest) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Body must be JSON' },
      { status: 400 }
    );
  }
  const prefixes = (body as { prefixes?: unknown })?.prefixes;
  if (!Array.isArray(prefixes) || prefixes.some(p => typeof p !== 'string')) {
    return NextResponse.json(
      { success: false, error: 'Body must be { prefixes: string[] }' },
      { status: 400 }
    );
  }

  const before = getCacheStats();
  const beforeCount = before.size;
  for (const p of prefixes as string[]) {
    clearCacheByPrefix(p);
  }
  const after = getCacheStats();
  const cleared = beforeCount - after.size;

  console.log(`[admin/invalidate-cache] Cleared ${cleared} entries matching prefixes:`, prefixes);

  return NextResponse.json({
    success: true,
    cleared,
    remaining: after.size,
    prefixes,
    note: 'In-memory cache only on this instance. For Aurora dm_overview_cache, POST /api/dm-overview/refresh separately.',
  });
}
