/**
 * Authenticated Fetch
 *
 * Drop-in replacement for fetch() that automatically attaches
 * the Firebase ID token as a Bearer token in the Authorization header.
 *
 * In dev mode (`NODE_ENV !== 'production'`) it ALSO attaches three
 * `x-dev-user-*` headers so admin-gated API routes can identify the user
 * even when the server-side Firebase Admin SDK isn't configured locally.
 * The server only consults these headers when token verification fails AND
 * the dev fallback is active (see `src/lib/feedback/server-auth.ts`), so
 * production deployments are unaffected.
 *
 * Falls back to unauthenticated fetch if no user is signed in (should not
 * happen in practice since all pages require auth).
 */

import { auth } from '@/lib/firebase/config';

export async function authFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const currentUser = auth?.currentUser;

  if (currentUser) {
    const token = await currentUser.getIdToken();
    const headers = new Headers(init?.headers);
    headers.set('Authorization', `Bearer ${token}`);

    if (process.env.NODE_ENV !== 'production') {
      if (currentUser.uid) headers.set('x-dev-user-uid', currentUser.uid);
      if (currentUser.email) headers.set('x-dev-user-email', currentUser.email);
      if (currentUser.displayName)
        headers.set('x-dev-user-name', currentUser.displayName);
    }

    return fetch(input, { ...init, headers });
  }

  // No user signed in — send request without auth (will get 401)
  return fetch(input, init);
}
