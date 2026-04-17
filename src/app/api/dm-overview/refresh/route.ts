/**
 * DM Overview — Refresh endpoint
 *
 * Cron-only (CRON_SECRET auth). Paginates PCM, recomputes all 4 Overview
 * payloads, and upserts them into Aurora `dm_overview_cache`. This is the
 * ONLY path that pays the ~90s PCM pagination cost in production.
 *
 * Invoked every 15 min by .github/workflows/overview-warmup.yml so the
 * user-facing GET /api/dm-overview always reads from a fresh cache.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import { refreshAllCaches } from '../compute';

export async function POST(request: NextRequest) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  try {
    const result = await refreshAllCaches();
    console.log(`[dm-overview/refresh] Refreshed ${result.keys.length} keys in ${result.durationMs}ms`);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('[dm-overview/refresh] failed:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}
