/**
 * POST /api/pcm-alignment/daily-digest
 *
 * Cron-only (CRON_SECRET auth). Reads the latest alignment state per
 * (widget × sub × campaign_type) and posts a single Slack summary listing
 * everything currently at yellow or red.
 *
 * Invoked Mon–Fri at 09:00 EST (14:00 UTC) by
 * .github/workflows/pcm-alignment-digest.yml
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import { getPreviousSeverityMap } from '@/lib/pcm-alignment/firestore-io';
import { fireDailyDigest } from '@/lib/pcm-alignment/slack-alerts';
import type { AlignmentDoc } from '@/types/pcm-alignment';

export async function POST(request: NextRequest) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  try {
    // "Latest per combo, before now" = latest overall since the reconciler's
    // most recent run is before this digest run. Same helper the reconciler
    // uses for transition detection — kept DRY.
    const map = await getPreviousSeverityMap(new Date().toISOString());
    const latest: AlignmentDoc[] = Array.from(map.values());
    const alerting = latest.filter(
      (d) => d.severity === 'yellow' || d.severity === 'red',
    );

    const sent = await fireDailyDigest(alerting);

    return NextResponse.json({
      success: true,
      total_widgets_evaluated: latest.length,
      alerting_count: alerting.length,
      red_count: alerting.filter((d) => d.severity === 'red').length,
      yellow_count: alerting.filter((d) => d.severity === 'yellow').length,
      slack_sent: sent,
    });
  } catch (error) {
    console.error('[pcm-alignment/daily-digest] failed:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 },
    );
  }
}
