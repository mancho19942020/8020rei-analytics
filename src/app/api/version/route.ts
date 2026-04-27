/**
 * GET /api/version — current production build identifier.
 *
 * The client polls this endpoint every minute and compares the returned
 * `sha` against the `BUILD_ID` baked into the running bundle. A mismatch
 * means a newer version has been deployed while the user's tab was open;
 * the UpdateAvailableBanner surfaces it as a "Reload" pill.
 *
 * This endpoint is intentionally unauthenticated — it returns no user
 * data and the bare SHA is safe to expose (it's the same SHA visible in
 * /_next/static URLs and in any deployed image label).
 *
 * `dynamic = 'force-dynamic'` + `Cache-Control: no-store` together prevent
 * any layer (Next data cache, CDN, browser) from serving a stale value
 * after a deploy.
 */

import { NextResponse } from 'next/server';
import { BUILD_ID, BUILT_AT } from '@/lib/build-id';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export function GET() {
  return NextResponse.json(
    { sha: BUILD_ID, builtAt: BUILT_AT },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      },
    }
  );
}
