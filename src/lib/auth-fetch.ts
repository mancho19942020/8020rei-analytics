/**
 * Authenticated Fetch
 *
 * Drop-in replacement for fetch() that automatically attaches
 * the Firebase ID token as a Bearer token in the Authorization header.
 * Falls back to unauthenticated fetch if no user is signed in
 * (should not happen in practice since all pages require auth).
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
    return fetch(input, { ...init, headers });
  }

  // No user signed in — send request without auth (will get 401)
  return fetch(input, init);
}
