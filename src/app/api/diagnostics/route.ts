import { NextRequest, NextResponse } from 'next/server';
import { runQuery } from '@/lib/bigquery';
import { getDiagnosticUserDataQuery } from '@/lib/queries';

interface DiagnosticData {
  user_affiliation: string | null;
  user_id: string | null;
  event_count: number;
  unique_sessions: number;
  active_days: number;
  sample_events: string[];
}

/**
 * Diagnostic endpoint to inspect user affiliation data in GA4.
 * This verifies that the user_affiliation property is being sent correctly
 * from the main 8020REI platform.
 *
 * Usage: GET /api/diagnostics?days=7
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const days = parseInt(searchParams.get('days') || '7');

  console.log(`[Diagnostics] Fetching user affiliation data for last ${days} days`);

  try {
    const data = await runQuery<DiagnosticData>(getDiagnosticUserDataQuery(days));

    // Calculate summary statistics
    const summary = {
      total_records: data.length,
      internal_users: data.filter(d => d.user_affiliation === 'internal').length,
      external_users: data.filter(d => d.user_affiliation === 'external').length,
      unauthenticated: data.filter(d => !d.user_affiliation).length,
      has_affiliation: data.filter(d => d.user_affiliation !== null).length,
      total_events: data.reduce((sum, d) => sum + d.event_count, 0),
    };

    const hasAffiliationData = summary.has_affiliation > 0;

    return NextResponse.json({
      success: true,
      summary,
      sample_data: data.slice(0, 20), // Return top 20 for inspection
      message: !hasAffiliationData
        ? '⚠️ No user_affiliation data found. The main 8020REI platform may not be sending this property to GA4.'
        : `✅ Found ${summary.internal_users} internal and ${summary.external_users} external users. Filters should work correctly!`,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Diagnostics] BigQuery error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch diagnostic data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
