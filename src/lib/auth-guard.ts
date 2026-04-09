/**
 * API Route Auth Guard
 *
 * Two authentication strategies:
 * 1. Firebase ID token (for browser-based dashboard requests)
 * 2. Shared API secret (for cron/automation like GitHub Actions)
 *
 * Usage in any API route:
 *   const authError = await requireAuth(request);
 *   if (authError) return authError;
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyRequest } from '@/lib/firebase/admin';

const CRON_SECRET = process.env.CRON_SECRET;

/**
 * Check if request is authenticated. Returns null if OK, or a NextResponse error.
 */
export async function requireAuth(request: NextRequest): Promise<NextResponse | null> {
  // Strategy 1: Cron secret (for automated POST requests from GitHub Actions)
  const cronHeader = request.headers.get('x-cron-secret');
  if (cronHeader && CRON_SECRET && cronHeader === CRON_SECRET) {
    return null; // Authorized
  }

  // Strategy 2: Firebase ID token (for dashboard users)
  const result = await verifyRequest();

  if (!result.authenticated) {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: result.status || 401 }
    );
  }

  return null; // Authorized
}

/**
 * Require only cron secret auth (for automation-only routes).
 */
export function requireCronAuth(request: NextRequest): NextResponse | null {
  const cronHeader = request.headers.get('x-cron-secret');

  if (!CRON_SECRET) {
    // If no secret is configured, allow requests (dev mode)
    return null;
  }

  if (cronHeader !== CRON_SECRET) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  return null;
}
