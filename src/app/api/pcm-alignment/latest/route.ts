/**
 * GET /api/pcm-alignment/latest?widget_key=xxx
 *
 * Returns the latest AlignmentDoc per (sub_key × campaign_type) for the given
 * widget_key. Called by the WidgetAlignmentFooter component (Phase 4) to render:
 *   - "Reconciled: N min ago" footer
 *   - InconsistencyIcon + tooltip on sub-metrics where severity != 'green'
 *
 * No cron secret required — standard user auth via requireAuth.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import { getLatestForWidget } from '@/lib/pcm-alignment/firestore-io';

export async function GET(request: NextRequest) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  const url = new URL(request.url);
  const widget_key = url.searchParams.get('widget_key');

  if (!widget_key) {
    return NextResponse.json(
      { success: false, error: 'widget_key query param is required' },
      { status: 400 },
    );
  }

  try {
    const payload = await getLatestForWidget(widget_key);
    return NextResponse.json({ success: true, data: payload });
  } catch (error) {
    console.error(`[pcm-alignment/latest] widget_key=${widget_key} failed:`, error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 },
    );
  }
}
