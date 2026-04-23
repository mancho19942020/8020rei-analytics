/**
 * DM Campaign Business Results — Slack Alerts (Legacy)
 *
 * Redirects to /api/dm-conversions/business-alerts which now handles
 * business results alerts with threaded digests and state management.
 *
 * Kept for backwards compatibility with any existing callers.
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const baseUrl = request.nextUrl.origin;
  const force = request.nextUrl.searchParams.get('force') === 'true';
  const url = `${baseUrl}/api/dm-conversions/business-alerts${force ? '?force=true' : ''}`;

  try {
    const body = await request.text();
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body || '{}',
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : 'Failed to redirect to business-alerts',
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
