/**
 * DM Campaign Overview — Next.js API Route
 *
 * Thin read-through cache over `dm_overview_cache` (Aurora table). The heavy
 * computation (PCM pagination + aggregation) is owned by the /refresh cron
 * (`src/app/api/dm-overview/refresh/route.ts`). User-facing GET requests
 * never wait on PCM — they read from Aurora and return instantly.
 *
 * Fallback: if Aurora cache is missing entirely (fresh deploy, cron not yet
 * run), the GET triggers a fresh compute on-demand AND writes it back. This
 * means the very first user after a deploy pays the ~90s cost; steady-state
 * requests are always instant.
 *
 * Supports:
 *   GET ?type=headline      → 4 metric cards + testActivity + Aurora/PCM delta
 *   GET ?type=send-trend    → monthly PCM send counts (14 months)
 *   GET ?type=margin-trend  → monthly COMPANY margin (revenue − PCM cost incl. test)
 *   GET ?type=balance-flow  → daily PCM cost + account balance
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import {
  readCache,
  writeCache,
  fetchPcmOrdersSlim,
  computeHeadline,
  computeSendTrend,
  computeBalanceFlow,
} from './compute';

type OverviewType = 'headline' | 'send-trend' | 'balance-flow';
const VALID_TYPES: OverviewType[] = ['headline', 'send-trend', 'balance-flow'];

export async function GET(request: NextRequest) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  const type = (request.nextUrl.searchParams.get('type') || 'headline') as OverviewType;
  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ success: false, error: `Unknown type: ${type}` }, { status: 400 });
  }

  try {
    // Fast path: Aurora cache
    const cached = await readCache<unknown>(type);
    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached.data,
        cached: true,
        computedAt: cached.computedAt,
        ageMinutes: Math.round(cached.ageMinutes),
      });
    }

    // Slow path: compute on-demand. Happens once after a fresh deploy before
    // the cron has run. Subsequent requests read from the cache we just wrote.
    console.log(`[dm-overview] Cache miss for ${type} — computing live…`);
    const orders = await fetchPcmOrdersSlim();
    let data: unknown;
    switch (type) {
      case 'headline':
        data = await computeHeadline(orders);
        break;
      case 'send-trend':
        data = await computeSendTrend(orders);
        break;
      case 'balance-flow':
        data = await computeBalanceFlow(orders);
        break;
    }

    // Write-back so other concurrent callers benefit, but don't block the
    // response on the write.
    writeCache(type, data).catch((e) =>
      console.warn(`[dm-overview] write-back failed for ${type}:`, e instanceof Error ? e.message : String(e))
    );

    return NextResponse.json({ success: true, data, cached: false });
  } catch (error) {
    console.error(`[DM Overview] ${type} failed:`, error);
    return NextResponse.json(
      { success: false, error: `Unable to load ${type}. Please retry.` },
      { status: 500 }
    );
  }
}
