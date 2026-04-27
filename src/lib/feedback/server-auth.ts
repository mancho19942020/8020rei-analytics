/**
 * Server-side auth resolver for the feedback API routes.
 *
 * In production: validates the Firebase ID token via the Admin SDK and
 *                returns the decoded user.
 * In local dev:  falls back to trusting `x-dev-user-*` headers set by the
 *                client (`authFetch` mirrors them automatically). This
 *                matches the pattern used by `/api/suggestions` — see
 *                `src/lib/auth-guard.ts` — but extends it to admin-gated
 *                endpoints that need to know *who* the user is, not just
 *                "is anyone signed in".
 *
 * The dev fallback only triggers when:
 *   - `NODE_ENV === 'development'`, AND
 *   - `FIREBASE_ADMIN_CREDENTIALS_JSON` is not configured.
 * Production deployments always have credentials, so this branch is dead
 * code there.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyRequest } from '@/lib/firebase/admin';

const ALLOWED_DOMAIN = '8020rei.com';

export interface AuthenticatedUser {
  uid: string;
  email: string;
  name?: string;
}

export type AuthResolution =
  | { ok: true; user: AuthenticatedUser }
  | { ok: false; response: NextResponse };

function devFallbackEnabled(): boolean {
  return (
    process.env.NODE_ENV === 'development' &&
    !process.env.FIREBASE_ADMIN_CREDENTIALS_JSON
  );
}

function devUserFromHeaders(request: NextRequest): AuthenticatedUser | null {
  const email = request.headers.get('x-dev-user-email');
  const uid = request.headers.get('x-dev-user-uid');
  if (!email || !uid) return null;
  if (!email.toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`)) return null;
  const name = request.headers.get('x-dev-user-name') ?? undefined;
  return { uid, email, name };
}

export async function resolveUser(request: NextRequest): Promise<AuthResolution> {
  // First try the production path: verify the Bearer token.
  const auth = await verifyRequest();
  if (auth.authenticated && auth.user) {
    return { ok: true, user: auth.user };
  }

  // Dev fallback: trust the dev-only headers the client adds via authFetch.
  if (devFallbackEnabled()) {
    const devUser = devUserFromHeaders(request);
    if (devUser) return { ok: true, user: devUser };
  }

  return {
    ok: false,
    response: NextResponse.json(
      { success: false, error: auth.error ?? 'Unauthorized' },
      { status: auth.status ?? 401 }
    ),
  };
}
