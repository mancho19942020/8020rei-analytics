/**
 * POST /api/pcm-alignment/reconcile
 *
 * Cron-only (CRON_SECRET auth). Runs one reconciliation pass: compares every
 * widget in the contract against its PCM ground truth, writes one AlignmentDoc
 * per (widget × campaign_type) to the Firestore `pcm_alignment_runs` collection,
 * and returns a summary.
 *
 * Dry-run: set env `PCM_ALIGNMENT_DRY_RUN=true` (or pass `?dry=1` query) to
 * compute + return results without writing to Firestore. Used during initial
 * rollout to confirm numbers look sane before going live.
 *
 * Invoked every 30 min at :15 and :45 by .github/workflows/pcm-alignment.yml
 * (staggered 15 min from overview-warmup at :00/:30 to avoid PCM rate-limit
 * collision and to ensure the warmup's cache is fresh when we read it).
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import { runReconcile } from '@/lib/pcm-alignment/reconciler';

export async function POST(request: NextRequest) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  const url = new URL(request.url);
  const queryDry = url.searchParams.get('dry') === '1';
  const envDry = process.env.PCM_ALIGNMENT_DRY_RUN === 'true';
  const dryRun = queryDry || envDry;

  try {
    const result = await runReconcile({ dryRun });
    console.log(
      `[pcm-alignment/reconcile] run=${result.run_id} dry=${dryRun} ` +
      `docs=${result.docs_written} green=${result.severity_counts.green} ` +
      `yellow=${result.severity_counts.yellow} red=${result.severity_counts.red} ` +
      `info=${result.severity_counts.info} ms=${result.duration_ms}`,
    );
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('[pcm-alignment/reconcile] failed:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 },
    );
  }
}
